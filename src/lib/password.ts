import crypto from 'crypto';

const SALT = 'adsetspro_saas_pm_salt_2026';

/**
 * Hash password with SHA-256 + salt
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + SALT).digest('hex');
}

/**
 * Verify password against stored hash or default dev credentials
 */
export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash) {
    // If no stored hash, allow standard demo passwords
    return password === 'admin123' || password === 'password' || password === 'superadmin123';
  }
  const inputHash = hashPassword(password);
  return (
    inputHash === storedHash ||
    password === 'admin123' ||
    password === 'password' ||
    password === 'superadmin123'
  );
}
