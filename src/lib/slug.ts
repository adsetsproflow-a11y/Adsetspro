import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

/**
 * Clean and normalize a string to a base slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .replace(/[\s_-]+/g, '-') // collapse whitespace and underscores to -
    .replace(/^-+|-+$/g, ''); // trim starting/trailing -
}

/**
 * Generate a random 4-character lowercase alphanumeric suffix
 */
export function randomSuffix(length = 4): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Generate a guaranteed unique collision-safe company slug
 * Example: "Acme Corp" -> "acme-corp-a12x"
 */
export async function generateUniqueCompanySlug(
  prisma: PrismaClient,
  companyName: string
): Promise<string> {
  const base = slugify(companyName) || 'company';
  let attempts = 0;
  const maxAttempts = 15;

  while (attempts < maxAttempts) {
    const suffix = randomSuffix(4);
    const candidateSlug = `${base}-${suffix}`;

    const existing = await prisma.company.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    });

    if (!existing) {
      return candidateSlug;
    }

    attempts++;
  }

  // Fallback with timestamp if high collision
  return `${base}-${Date.now().toString(36)}`;
}
