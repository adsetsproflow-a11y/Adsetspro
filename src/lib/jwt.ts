import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'adsetspro-pm-ultra-secure-secret-key-2026';

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  companyId: string;
  subdomain?: string;
  designation?: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token using HMAC-SHA256
 */
export function signJwt(payload: TokenPayload, expiresInSeconds = 86400 * 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Verify and decode a JWT token
 */
export function verifyJwt(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (sigB64 !== expectedSig) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as TokenPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && now > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
