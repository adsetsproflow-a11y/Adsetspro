import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token and its SHA-256 hash.
 * The raw token is returned to be sent via email or client response,
 * while only the tokenHash is stored in the database.
 */
export function generateSecureToken(byteLength = 32): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(byteLength).toString('hex');
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Compute SHA-256 hash of a raw token for database matching
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * Helper to generate future expiry timestamp
 */
export function createExpiryDate(durationMinutes: number): Date {
  return new Date(Date.now() + durationMinutes * 60 * 1000);
}
