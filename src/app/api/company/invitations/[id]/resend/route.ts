import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, recordAuditLog } from '@/lib/auth-helpers';
import { generateSecureToken, createExpiryDate } from '@/lib/security/tokens';
import { sendEmployeeInvitationEmail } from '@/lib/email';
import { CompanyRole, InvitationStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authUser = await getAuthenticatedUser(request);

    if (!authUser || !authUser.activeMembership) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    if (authUser.activeMembership.role !== CompanyRole.COMPANY_ADMIN && authUser.globalRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const companyId = authUser.activeMembership.companyId;

    // Strict tenant boundary: invitation must belong to the admin's company
    const invitation = await prisma.invitation.findFirst({
      where: { id, companyId },
      include: { company: true },
    });

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invitation not found.' }, { status: 404 });
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      return NextResponse.json(
        { success: false, error: 'This invitation has already been accepted.' },
        { status: 400 }
      );
    }

    // Generate fresh token
    const { rawToken, tokenHash } = generateSecureToken(32);
    const expiresAt = createExpiryDate(7 * 24 * 60);

    const updated = await prisma.invitation.update({
      where: { id },
      data: {
        tokenHash,
        status: InvitationStatus.PENDING,
        expiresAt,
      },
    });

    await sendEmployeeInvitationEmail({
      email: updated.email,
      name: updated.name,
      companyName: invitation.company.name,
      designation: updated.designation,
      rawToken,
      companyId,
    });

    await recordAuditLog({
      actorUserId: authUser.userId,
      companyId,
      action: 'EMPLOYEE_INVITATION_RESENT',
      targetType: 'INVITATION',
      targetId: id,
    });

    return NextResponse.json({
      success: true,
      message: `Invitation resent to ${updated.email}.`,
      inviteLink: `/accept-invitation?token=${rawToken}`,
    });
  } catch (error: any) {
    console.error('[API Resend Invitation Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error resending invitation.' },
      { status: 500 }
    );
  }
}
