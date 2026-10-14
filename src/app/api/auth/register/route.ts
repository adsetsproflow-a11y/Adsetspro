import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerCompanySchema } from '@/lib/validations/auth';
import { hashPassword } from '@/lib/security/password';
import { generateUniqueCompanySlug } from '@/lib/slug';
import { generateSecureToken, createExpiryDate } from '@/lib/security/tokens';
import { sendVerificationEmail } from '@/lib/email';
import { recordAuditLog } from '@/lib/auth-helpers';
import { GlobalRole, CompanyRole, CompanyStatus, AccountStatus, MembershipStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = registerCompanySchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.errors[0]?.message || 'Invalid registration form data.',
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { companyName, adminName, email, password, department } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email address already exists. Please sign in or use another email.',
        },
        { status: 409 }
      );
    }

    // 2. Hash password securely
    const passwordHash = await hashPassword(password);

    // 3. Generate collision-safe unique company slug (e.g. acme-media-a4b2)
    const slug = await generateUniqueCompanySlug(prisma, companyName);

    // 4. Generate verification token
    const { rawToken, tokenHash } = generateSecureToken(32);
    const verificationExpiry = createExpiryDate(24 * 60); // 24 hours

    // 5. Transactional creation: User, Company, CompanyMembership, and EmailVerificationToken
    const { user, company } = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          name: adminName.trim(),
          email: normalizedEmail,
          passwordHash,
          globalRole: GlobalRole.USER,
          accountStatus: AccountStatus.ACTIVE,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        },
      });

      // Create company in PENDING state
      const newCompany = await tx.company.create({
        data: {
          name: companyName.trim(),
          slug,
          status: CompanyStatus.PENDING,
        },
      });

      // Create company membership as COMPANY_ADMIN
      await tx.companyMembership.create({
        data: {
          userId: newUser.id,
          companyId: newCompany.id,
          role: CompanyRole.COMPANY_ADMIN,
          designation: 'Company Administrator',
          department: department || 'Management',
          membershipStatus: MembershipStatus.ACTIVE,
        },
      });

      // Save verification token hash
      await tx.emailVerificationToken.create({
        data: {
          userId: newUser.id,
          tokenHash,
          expiresAt: verificationExpiry,
        },
      });

      return { user: newUser, company: newCompany };
    });

    // 6. Send verification email (non-blocking failure resilience)
    await sendVerificationEmail(normalizedEmail, rawToken, adminName, user.id);

    // 7. Audit log registration event
    await recordAuditLog({
      actorUserId: user.id,
      companyId: company.id,
      action: 'COMPANY_REGISTERED',
      targetType: 'COMPANY',
      targetId: company.id,
      metadata: {
        companyName: company.name,
        companySlug: company.slug,
        adminEmail: user.email,
        status: company.status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          'Company registered successfully! Please check your email to verify your address. Note that your workspace requires Super Admin approval before activation.',
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          status: company.status,
        },
        requiresApproval: true,
        emailSent: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API Register Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed due to a server error.' },
      { status: 500 }
    );
  }
}
