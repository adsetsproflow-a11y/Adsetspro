import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, recordAuditLog } from '@/lib/auth-helpers';
import { inviteEmployeeSchema } from '@/lib/validations/auth';
import { generateSecureToken, createExpiryDate } from '@/lib/security/tokens';
import { sendEmployeeInvitationEmail } from '@/lib/email';
import { CompanyRole, CompanyStatus, InvitationStatus, MembershipStatus } from '@prisma/client';

/**
 * GET /api/company/invitations
 * List all invitations for the active company admin's company
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser || !authUser.activeMembership) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Company Admin access required.' },
        { status: 401 }
      );
    }

    if (authUser.activeMembership.role !== CompanyRole.COMPANY_ADMIN && authUser.globalRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Only Company Admins can view invitations.' },
        { status: 403 }
      );
    }

    const companyId = authUser.activeMembership.companyId;

    const invitations = await prisma.invitation.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        designation: true,
        department: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
        invitedBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      invitations,
      count: invitations.length,
    });
  } catch (error: any) {
    console.error('[API List Invitations Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error listing invitations.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/company/invitations
 * Create and send employee invitation
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser || !authUser.activeMembership) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Company Admin access required.' },
        { status: 401 }
      );
    }

    if (authUser.activeMembership.role !== CompanyRole.COMPANY_ADMIN && authUser.globalRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Only active Company Admins can invite employees.' },
        { status: 403 }
      );
    }

    // Strictly enforce companyId from authenticated session, never request body
    const companyId = authUser.activeMembership.companyId;

    // Check company status
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || company.status !== CompanyStatus.ACTIVE) {
      return NextResponse.json(
        { success: false, error: 'Company workspace is not active. Invitations cannot be issued.' },
        { status: 403 }
      );
    }

    const json = await request.json();
    const result = inviteEmployeeSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.errors[0]?.message || 'Invalid invitation data.',
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { fullName, email, designation, department, expiryDays } = result.data;
    const cleanEmail = email.trim().toLowerCase();

    // Check if user is already an active member of this company
    const existingMember = await prisma.companyMembership.findFirst({
      where: {
        companyId,
        user: { email: cleanEmail },
        membershipStatus: MembershipStatus.ACTIVE,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'This user is already an active member of your company workspace.' },
        { status: 409 }
      );
    }

    // Invalidate existing pending invitations for this email in this company
    await prisma.invitation.updateMany({
      where: {
        companyId,
        email: cleanEmail,
        status: InvitationStatus.PENDING,
      },
      data: { status: InvitationStatus.REVOKED },
    });

    // Generate secure single-use invitation token
    const { rawToken, tokenHash } = generateSecureToken(32);
    const expiresAt = createExpiryDate(expiryDays * 24 * 60);

    const invitation = await prisma.invitation.create({
      data: {
        companyId,
        email: cleanEmail,
        name: fullName.trim(),
        designation: designation.trim(),
        department: department || 'Development',
        tokenHash,
        status: InvitationStatus.PENDING,
        expiresAt,
        invitedById: authUser.userId,
      },
    });

    // Send invitation email
    await sendEmployeeInvitationEmail({
      email: cleanEmail,
      name: fullName.trim(),
      companyName: company.name,
      designation,
      rawToken,
      companyId,
    });

    // Record audit log
    await recordAuditLog({
      actorUserId: authUser.userId,
      companyId,
      action: 'EMPLOYEE_INVITATION_CREATED',
      targetType: 'INVITATION',
      targetId: invitation.id,
      metadata: {
        invitedEmail: cleanEmail,
        invitedName: fullName,
        designation,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Invitation successfully sent to ${cleanEmail}.`,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          name: invitation.name,
          designation: invitation.designation,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
        },
        // In development/test mode, provide invitation link for ease of end-to-end verification
        inviteLink: `/accept-invitation?token=${rawToken}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API Create Invitation Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error creating employee invitation.' },
      { status: 500 }
    );
  }
}
