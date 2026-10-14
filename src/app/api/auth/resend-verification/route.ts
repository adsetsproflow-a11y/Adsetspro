import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resendVerificationSchema } from '@/lib/validations/auth';
import { generateSecureToken, createExpiryDate } from '@/lib/security/tokens';
import { sendVerificationEmail } from '@/lib/email';
import { recordAuditLog } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = resendVerificationSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const cleanEmail = email.trim().toLowerCase();

    const genericSuccess = NextResponse.json({
      success: true,
      message: 'If your account is pending verification, a new link has been dispatched to your email.',
    });

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || user.emailVerifiedAt) {
      return genericSuccess;
    }

    // Invalidate prior unused tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Create fresh verification token
    const { rawToken, tokenHash } = generateSecureToken(32);
    const expiresAt = createExpiryDate(24 * 60);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await sendVerificationEmail(cleanEmail, rawToken, user.name, user.id);

    await recordAuditLog({
      actorUserId: user.id,
      action: 'EMAIL_VERIFICATION_RESENT',
      targetType: 'USER',
      targetId: user.id,
    });

    return genericSuccess;
  } catch (error: any) {
    console.error('[API Resend Verification Error]', error);
    return NextResponse.json(
      { success: false, error: 'Error resending verification email.' },
      { status: 500 }
    );
  }
}
