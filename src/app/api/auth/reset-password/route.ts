import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { hashToken } from '@/lib/security/tokens';
import { hashPassword } from '@/lib/security/password';
import { revokeAllUserSessions, clearAuthCookies } from '@/lib/security/jwt';
import { recordAuditLog } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = resetPasswordSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.errors[0]?.message || 'Invalid password reset submission.',
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token, newPassword } = result.data;
    const incomingHash = hashToken(token);

    // Find token record
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: incomingHash },
      include: { user: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unrecognized reset token.' },
        { status: 400 }
      );
    }

    if (resetRecord.usedAt) {
      return NextResponse.json(
        { success: false, error: 'This password reset link has already been used.' },
        { status: 400 }
      );
    }

    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'This password reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // In a transaction: update password, mark token used, and revoke all sessions
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      // Revoke all existing refresh sessions for this user
      await tx.refreshToken.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    // Audit log
    await recordAuditLog({
      actorUserId: resetRecord.userId,
      action: 'PASSWORD_RESET_SUCCESSFUL',
      targetType: 'USER',
      targetId: resetRecord.userId,
      metadata: {
        reason: 'Password successfully reset via token. All previous sessions revoked.',
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new credentials.',
    });

    clearAuthCookies(response);

    return response;
  } catch (error: any) {
    console.error('[API Reset Password Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating password.' },
      { status: 500 }
    );
  }
}
