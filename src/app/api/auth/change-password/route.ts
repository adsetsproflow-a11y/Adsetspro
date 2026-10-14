import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { changePasswordSchema } from '@/lib/validations/auth';
import { getAuthenticatedUser, recordAuditLog } from '@/lib/auth-helpers';
import { verifyPassword, hashPassword } from '@/lib/security/password';
import { revokeAllUserSessions, clearAuthCookies } from '@/lib/security/jwt';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const json = await request.json();
    const result = changePasswordSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || 'Invalid password data.',
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User account not found.' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: 'The current password you entered is incorrect.' },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all refresh sessions
    await revokeAllUserSessions(user.id);

    // Audit log
    await recordAuditLog({
      actorUserId: user.id,
      companyId: authUser.activeMembership?.companyId,
      action: 'PASSWORD_CHANGED',
      targetType: 'USER',
      targetId: user.id,
      metadata: { reason: 'User updated their password. Prior sessions invalidated.' },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.',
    });

    clearAuthCookies(response);

    return response;
  } catch (error: any) {
    console.error('[API Change Password Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error changing password.' },
      { status: 500 }
    );
  }
}
