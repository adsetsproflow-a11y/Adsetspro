import { prisma } from './prisma';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
  companyId?: string;
  type: string;
}

export interface EmailResult {
  success: boolean;
  provider: 'resend' | 'simulated-development';
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Adsetspro Notifications <notifications@adsetsproflow.com>';
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://adsetsproflow.com';

/**
 * Dispatch transactional email.
 * If RESEND_API_KEY is not configured, logs the email cleanly to the console
 * and records an in-app Notification/audit entry, without failing the parent database transaction!
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  userId,
  companyId,
  type,
}: SendEmailParams): Promise<EmailResult> {
  try {
    if (RESEND_API_KEY && RESEND_API_KEY.startsWith('re_')) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: [to],
          subject,
          html,
          text: text || subject,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.warn(`[Email Provider Error] Resend error:`, data);
        return {
          success: false,
          provider: 'resend',
          error: data.message || 'Failed to send via Resend',
        };
      }

      return {
        success: true,
        provider: 'resend',
        messageId: data.id,
      };
    }

    // Safe development preview mode when RESEND_API_KEY is not configured
    console.log(`\n======================================================`);
    console.log(`[TRANSACTIONAL EMAIL DISPATCHED (Development / Simulated)]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Type: ${type}`);
    console.log(`Body Preview:`);
    console.log(text || subject);
    console.log(`======================================================\n`);

    // Record In-app notification for the recipient if userId is known
    if (userId) {
      try {
        await prisma.notification.create({
          data: {
            userId,
            companyId,
            type,
            title: subject,
            message: text || subject,
          },
        });
      } catch (err) {
        console.warn('Failed to record notification row:', err);
      }
    }

    return {
      success: true,
      provider: 'simulated-development',
      messageId: `sim_${Date.now()}`,
    };
  } catch (error: any) {
    console.error('[sendEmail Error]', error);
    // Never throw: email delivery failure must not abort committed business logic
    return {
      success: false,
      provider: 'simulated-development',
      error: error.message || 'Unknown email failure',
    };
  }
}

/**
 * Verification Email Template
 */
export async function sendVerificationEmail(
  email: string,
  rawToken: string,
  userName: string,
  userId?: string
): Promise<EmailResult> {
  const verifyLink = `${APP_URL}/verify-email?token=${rawToken}`;
  const subject = 'Verify your email address — SAAA SaaS Platform';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 20px; background-color: #ffffff; color: #18181b;">
      <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e4e4e7;">
        <h2 style="margin: 0; color: #4f46e5; font-size: 20px; font-weight: 800;">SAAA Multi-Tenant SaaS</h2>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #27272a;">Hello <strong>${userName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.5; color: #52525b;">Thank you for registering your company on SAAA. Please click the button below to verify your work email address:</p>
      <div style="margin: 28px 0;">
        <a href="${verifyLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Verify Work Email</a>
      </div>
      <p style="font-size: 12px; color: #71717a;">Or copy and paste this link into your browser:<br/><a href="${verifyLink}" style="color: #4f46e5;">${verifyLink}</a></p>
      <p style="font-size: 12px; color: #a1a1aa; margin-top: 32px; border-top: 1px solid #f4f4f5; padding-top: 16px;">This link will expire in 24 hours. If you did not create this account, please ignore this email.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text: `Verify your email by visiting: ${verifyLink}`,
    userId,
    type: 'EMAIL_VERIFICATION',
  });
}

/**
 * Password Reset Email Template
 */
export async function sendPasswordResetEmail(
  email: string,
  rawToken: string,
  userId?: string
): Promise<EmailResult> {
  const resetLink = `${APP_URL}/reset-password?token=${rawToken}`;
  const subject = 'Reset your password — SAAA SaaS Platform';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 20px; background-color: #ffffff; color: #18181b;">
      <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e4e4e7;">
        <h2 style="margin: 0; color: #4f46e5; font-size: 20px; font-weight: 800;">SAAA Multi-Tenant SaaS</h2>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #27272a;">Hello,</p>
      <p style="font-size: 14px; line-height: 1.5; color: #52525b;">We received a request to reset your password. Click the secure button below to choose a new password:</p>
      <div style="margin: 28px 0;">
        <a href="${resetLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Reset Password</a>
      </div>
      <p style="font-size: 12px; color: #71717a;">Or copy and paste this link into your browser:<br/><a href="${resetLink}" style="color: #4f46e5;">${resetLink}</a></p>
      <p style="font-size: 12px; color: #a1a1aa; margin-top: 32px; border-top: 1px solid #f4f4f5; padding-top: 16px;">This single-use link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text: `Reset your password by visiting: ${resetLink}`,
    userId,
    type: 'PASSWORD_RESET',
  });
}

/**
 * Employee Invitation Email Template
 */
export async function sendEmployeeInvitationEmail({
  email,
  name,
  companyName,
  designation,
  rawToken,
  companyId,
}: {
  email: string;
  name: string;
  companyName: string;
  designation?: string | null;
  rawToken: string;
  companyId: string;
}): Promise<EmailResult> {
  const inviteLink = `${APP_URL}/accept-invitation?token=${rawToken}`;
  const subject = `You're invited to join ${companyName} on SAAA`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 20px; background-color: #ffffff; color: #18181b;">
      <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e4e4e7;">
        <h2 style="margin: 0; color: #4f46e5; font-size: 20px; font-weight: 800;">SAAA Multi-Tenant SaaS</h2>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #27272a;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.5; color: #52525b;">
        You have been invited to join <strong>${companyName}</strong> workspace as <strong>${designation || 'Team Member'}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #52525b;">Click below to activate your account and set up your password:</p>
      <div style="margin: 28px 0;">
        <a href="${inviteLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Accept Invitation</a>
      </div>
      <p style="font-size: 12px; color: #71717a;">Or copy and paste this link into your browser:<br/><a href="${inviteLink}" style="color: #4f46e5;">${inviteLink}</a></p>
      <p style="font-size: 12px; color: #a1a1aa; margin-top: 32px; border-top: 1px solid #f4f4f5; padding-top: 16px;">This invitation is single-use and will expire in 7 days.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text: `Accept your invitation to ${companyName} by visiting: ${inviteLink}`,
    companyId,
    type: 'EMPLOYEE_INVITATION',
  });
}
