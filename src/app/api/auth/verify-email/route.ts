import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmailSchema } from '@/lib/validations/auth';
import { hashToken } from '@/lib/security/tokens';
import { recordAuditLog } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = verifyEmailSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required.' },
        { status: 400 }
      );
    }

    const { token } = result.data;
    const tokenHash = hashToken(token);

    const tokenRecord = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unrecognized email verification token.' },
        { status: 400 }
      );
    }

    if (tokenRecord.usedAt) {
      return NextResponse.json(
        { success: false, error: 'This verification token has already been used.' },
        { status: 400 }
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'This verification link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark email verified and token used
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: { emailVerifiedAt: new Date() },
      });

      await tx.emailVerificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      });
    });

    await recordAuditLog({
      actorUserId: tokenRecord.userId,
      action: 'EMAIL_VERIFIED',
      targetType: 'USER',
      targetId: tokenRecord.userId,
      metadata: { email: tokenRecord.user.email },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now access your account.',
      email: tokenRecord.user.email,
    });
  } catch (error: any) {
    console.error('[API Verify Email Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error verifying email.' },
      { status: 500 }
    );
  }
}
