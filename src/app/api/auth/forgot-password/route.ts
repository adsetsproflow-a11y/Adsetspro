import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { generateSecureToken, createExpiryDate } from '@/lib/security/tokens';
import { sendPasswordResetEmail } from '@/lib/email';
import { recordAuditLog } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = forgotPasswordSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const cleanEmail = email.trim().toLowerCase();

    // Generic response message to prevent email enumeration
    const genericSuccess = NextResponse.json({
      success: true,
      message:
        'If an account exists for that email, a password reset link has been dispatched. Please check your inbox.',
    });

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || user.accountStatus !== 'ACTIVE') {
      return genericSuccess;
    }

    // Invalidate existing unused reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate secure single-use token (valid 1 hour)
    const { rawToken, tokenHash } = generateSecureToken(32);
    const expiresAt = createExpiryDate(60);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Send reset email
    await sendPasswordResetEmail(cleanEmail, rawToken, user.id);

    // Audit event
    await recordAuditLog({
      actorUserId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      targetType: 'USER',
      targetId: user.id,
      metadata: { email: cleanEmail },
    });

    return genericSuccess;
  } catch (error: any) {
    console.error('[API Forgot Password Error]', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
