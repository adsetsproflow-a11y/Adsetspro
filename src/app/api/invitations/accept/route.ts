import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { acceptInvitationSchema } from '@/lib/validations/auth';
import { hashToken } from '@/lib/security/tokens';
import { hashPassword } from '@/lib/security/password';
import { signAccessToken, createRefreshTokenSession, setAuthCookies } from '@/lib/security/jwt';
import { recordAuditLog } from '@/lib/auth-helpers';
import { GlobalRole, CompanyRole, CompanyStatus, AccountStatus, InvitationStatus, MembershipStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = acceptInvitationSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.errors[0]?.message || 'Invalid form submission.',
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token, fullName, password } = result.data;
    const incomingHash = hashToken(token);

    // 1. Find invitation by hash
    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash: incomingHash },
      include: {
        company: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unrecognized invitation token.' },
        { status: 400 }
      );
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      return NextResponse.json(
        { success: false, error: 'This invitation has already been accepted.' },
        { status: 400 }
      );
    }

    if (invitation.status === InvitationStatus.REVOKED) {
      return NextResponse.json(
        { success: false, error: 'This invitation has been revoked by the company administrator.' },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      return NextResponse.json(
        { success: false, error: 'This invitation link has expired. Please ask your administrator to resend.' },
        { status: 400 }
      );
    }

    // 2. Validate company status: must be ACTIVE
    if (invitation.company.status !== CompanyStatus.ACTIVE) {
      return NextResponse.json(
        {
          success: false,
          error: `The workspace for ${invitation.company.name} is currently ${invitation.company.status}. Invitations can only be accepted once the company is approved and active.`,
        },
        { status: 403 }
      );
    }

    const normalizedEmail = invitation.email.toLowerCase().trim();
    const displayName = (fullName || invitation.name).trim();
    const passwordHash = await hashPassword(password);

    // 3. In a transaction: provision user & membership, mark invitation accepted
    const { user, membership } = await prisma.$transaction(async (tx) => {
      let employeeUser = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!employeeUser) {
        // Create new User account
        employeeUser = await tx.user.create({
          data: {
            name: displayName,
            email: normalizedEmail,
            passwordHash,
            globalRole: GlobalRole.USER,
            accountStatus: AccountStatus.ACTIVE,
            emailVerifiedAt: new Date(), // Implicitly verified via clicking secret email invite token
            avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
          },
        });
      } else {
        // Update existing user's password if requested
        employeeUser = await tx.user.update({
          where: { id: employeeUser.id },
          data: {
            passwordHash,
            name: displayName || employeeUser.name,
            emailVerifiedAt: employeeUser.emailVerifiedAt || new Date(),
          },
        });
      }

      // Upsert CompanyMembership as EMPLOYEE
      const newMembership = await tx.companyMembership.upsert({
        where: {
          userId_companyId: {
            userId: employeeUser.id,
            companyId: invitation.companyId,
          },
        },
        update: {
          role: CompanyRole.EMPLOYEE,
          designation: invitation.designation || 'Team Member',
          department: invitation.department || 'Operations',
          membershipStatus: MembershipStatus.ACTIVE,
        },
        create: {
          userId: employeeUser.id,
          companyId: invitation.companyId,
          role: CompanyRole.EMPLOYEE,
          designation: invitation.designation || 'Team Member',
          department: invitation.department || 'Operations',
          membershipStatus: MembershipStatus.ACTIVE,
        },
      });

      // Mark invitation accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      // Create notification for Company Admin
      await tx.notification.create({
        data: {
          userId: invitation.invitedById,
          companyId: invitation.companyId,
          type: 'INVITATION_ACCEPTED',
          title: 'Employee Invitation Accepted',
          message: `${displayName} (${normalizedEmail}) has accepted your invitation and joined ${invitation.company.name}.`,
        },
      });

      return { user: employeeUser, membership: newMembership };
    });

    // 4. Audit acceptance
    await recordAuditLog({
      actorUserId: user.id,
      companyId: invitation.companyId,
      action: 'EMPLOYEE_INVITATION_ACCEPTED',
      targetType: 'INVITATION',
      targetId: invitation.id,
      metadata: {
        companySlug: invitation.company.slug,
        employeeEmail: normalizedEmail,
      },
    });

    // 5. Issue session tokens for seamless immediate login
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
      activeCompanyId: invitation.company.id,
      companyRole: CompanyRole.EMPLOYEE,
      companySlug: invitation.company.slug,
      designation: membership.designation,
      department: membership.department,
    });

    const { rawToken: refreshToken } = await createRefreshTokenSession(user.id);

    const redirectUrl = `/c/${invitation.company.slug}/my-tasks`;

    const response = NextResponse.json({
      success: true,
      message: `Welcome to ${invitation.company.name}! Your account is now active.`,
      redirectUrl,
      accessToken,
      company: {
        id: invitation.company.id,
        name: invitation.company.name,
        slug: invitation.company.slug,
      },
    });

    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error: any) {
    console.error('[API Accept Invitation Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error accepting invitation.' },
      { status: 500 }
    );
  }
}
