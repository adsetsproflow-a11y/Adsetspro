import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;
const LEGACY_SALT = 'adsetspro_saas_pm_salt_2026';

/**
 * Hash password with bcrypt (12 rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Synchronous hash version for seed scripts
 */
export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * Verify a plain password against stored hash.
 * Supports:
 * 1. bcrypt hashes ($2a$, $2b$, $2y$)
 * 2. Legacy SHA-256 + salt hashes
 * 3. Safe fallback in development environments for demo fixtures
 */
export async function verifyPassword(password: string, storedHash?: string | null): Promise<boolean> {
  if (!storedHash || !password) return false;

  // 1. If stored hash is bcrypt format
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(password, storedHash);
    } catch {
      return false;
    }
  }

  // 2. Check legacy SHA-256 hash
  const legacyHash = crypto.createHash('sha256').update(password + LEGACY_SALT).digest('hex');
  if (legacyHash === storedHash) {
    return true;
  }

  // 3. Dev credential allowance for demo accounts if explicit hash matched
  if (process.env.NODE_ENV !== 'production') {
    if (password === storedHash) {
      return true;
    }
  }

  return false;
}
