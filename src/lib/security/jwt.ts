import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureToken, hashToken, createExpiryDate } from './tokens';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'saaa_jwt_access_ultra_secure_secret_key_prod_2026_9x8q7w';
const ISSUER = process.env.JWT_ISSUER || 'saaa-platform';
const AUDIENCE = process.env.JWT_AUDIENCE || 'saaa-platform-users';

// Access tokens are short-lived (15 minutes)
export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 900 seconds
// Refresh tokens live for 7 days
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface AccessTokenPayload {
  userId: string;
  email: string;
  name: string;
  globalRole: string; // 'SUPER_ADMIN' | 'USER'
  activeCompanyId?: string | null;
  companyRole?: string | null; // 'COMPANY_ADMIN' | 'EMPLOYEE'
  companySlug?: string | null;
  designation?: string | null;
  department?: string | null;
}

/**
 * Sign a short-lived access JWT token
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
  });
}

/**
 * Verify and decode an access JWT token
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as AccessTokenPayload & jwt.JwtPayload;

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      globalRole: decoded.globalRole,
      activeCompanyId: decoded.activeCompanyId,
      companyRole: decoded.companyRole,
      companySlug: decoded.companySlug,
      designation: decoded.designation,
      department: decoded.department,
    };
  } catch {
    return null;
  }
}

/**
 * Issue a new refresh token and persist its SHA-256 hash in the database
 */
export async function createRefreshTokenSession(userId: string): Promise<{ rawToken: string; expiresAt: Date }> {
  const { rawToken, tokenHash } = generateSecureToken(48);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

/**
 * Rotate a refresh token with strict reuse detection:
 * If an already-revoked refresh token is presented, revoke the entire token family
 * for this user to neutralize compromised credentials.
 */
export async function rotateRefreshTokenSession(
  rawRefreshToken: string
): Promise<{ success: boolean; newRawToken?: string; userId?: string; error?: string }> {
  const incomingHash = hashToken(rawRefreshToken);

  const existingRecord = await prisma.refreshToken.findUnique({
    where: { tokenHash: incomingHash },
    include: { user: true },
  });

  if (!existingRecord) {
    return { success: false, error: 'Invalid refresh session token.' };
  }

  // REUSE DETECTION: If token was already revoked, someone is replaying a stolen token!
  if (existingRecord.revokedAt) {
    // Invalidate all active refresh tokens for this compromised account immediately
    await prisma.refreshToken.updateMany({
      where: { userId: existingRecord.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Log security alert
    await prisma.auditLog.create({
      data: {
        actorUserId: existingRecord.userId,
        action: 'SECURITY_ALERT_REFRESH_TOKEN_REUSE_DETECTED',
        targetType: 'USER',
        targetId: existingRecord.userId,
        metadata: JSON.stringify({
          attemptedTokenHash: incomingHash,
          reason: 'Attempted to use an already-revoked refresh token. Revoked all user sessions.',
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return {
      success: false,
      error: 'Security alert: Refresh token reuse detected. All active sessions have been revoked.',
    };
  }

  // Check expiration
  if (new Date() > existingRecord.expiresAt) {
    await prisma.refreshToken.update({
      where: { id: existingRecord.id },
      data: { revokedAt: new Date() },
    });
    return { success: false, error: 'Refresh token has expired. Please log in again.' };
  }

  // Check user active status
  if (existingRecord.user.accountStatus !== 'ACTIVE') {
    return { success: false, error: 'Account is disabled.' };
  }

  // Create new rotated refresh token
  const { rawToken: newRawToken, tokenHash: newTokenHash } = generateSecureToken(48);
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // In a single transaction: create new token and mark old token revoked + replacedById
  await prisma.$transaction(async (tx) => {
    const newTokenRecord = await tx.refreshToken.create({
      data: {
        userId: existingRecord.userId,
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
      },
    });

    await tx.refreshToken.update({
      where: { id: existingRecord.id },
      data: {
        revokedAt: new Date(),
        replacedById: newTokenRecord.id,
      },
    });
  });

  return {
    success: true,
    newRawToken,
    userId: existingRecord.userId,
  };
}

/**
 * Revoke a specific refresh token session (e.g. on logout)
 */
export async function revokeRefreshToken(rawRefreshToken: string): Promise<void> {
  const hash = hashToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke all sessions for a user (e.g. after password reset)
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Attach secure HttpOnly cookies for access and refresh tokens
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // Access token cookie (short-lived)
  response.cookies.set('saas_access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
  });

  // Legacy cookie for backward compatibility with existing UI components
  response.cookies.set('saas_auth_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
  });

  // Refresh token cookie (7 days)
  if (refreshToken) {
    response.cookies.set('saas_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    });
  }
}

/**
 * Clear authentication cookies on logout or session invalidation
 */
export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set('saas_access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('saas_auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('saas_refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
