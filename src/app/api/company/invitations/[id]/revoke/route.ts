import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, recordAuditLog } from '@/lib/auth-helpers';
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

    const invitation = await prisma.invitation.findFirst({
      where: { id, companyId },
    });

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invitation not found.' }, { status: 404 });
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      return NextResponse.json(
        { success: false, error: 'Cannot revoke an already accepted invitation.' },
        { status: 400 }
      );
    }

    const updated = await prisma.invitation.update({
      where: { id },
      data: { status: InvitationStatus.REVOKED },
    });

    await recordAuditLog({
      actorUserId: authUser.userId,
      companyId,
      action: 'EMPLOYEE_INVITATION_REVOKED',
      targetType: 'INVITATION',
      targetId: id,
      metadata: { email: updated.email },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation for ${updated.email} has been revoked.`,
    });
  } catch (error: any) {
    console.error('[API Revoke Invitation Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error revoking invitation.' },
      { status: 500 }
    );
  }
}
