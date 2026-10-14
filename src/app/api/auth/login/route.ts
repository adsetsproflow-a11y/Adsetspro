import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations/auth';
import { verifyPassword } from '@/lib/security/password';
import { signAccessToken, createRefreshTokenSession, setAuthCookies } from '@/lib/security/jwt';
import { recordAuditLog } from '@/lib/auth-helpers';
import { GlobalRole, CompanyRole, CompanyStatus, AccountStatus, MembershipStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = loginSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || 'Invalid email or password.',
        },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch user by email with memberships and company
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        memberships: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password credentials.' },
        { status: 401 }
      );
    }

    // 2. Check account status
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      return NextResponse.json(
        { success: false, error: 'Your account has been disabled. Please contact support.' },
        { status: 403 }
      );
    }

    // 3. Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      // Audit failed login attempt
      await recordAuditLog({
        actorUserId: user.id,
        action: 'AUTH_LOGIN_FAILED_WRONG_PASSWORD',
        targetType: 'USER',
        targetId: user.id,
        metadata: { email: cleanEmail },
      });

      return NextResponse.json(
        { success: false, error: 'Invalid email or password credentials.' },
        { status: 401 }
      );
    }

    // 4. Determine redirect path and workspace context
    let redirectUrl = '/';
    let companyContext: any = null;
    let companyRole: CompanyRole | null = null;
    let accessStatus = 'ACTIVE';

    if (user.globalRole === GlobalRole.SUPER_ADMIN) {
      redirectUrl = '/super-admin/dashboard';
    } else {
      // Find active membership
      const primaryMembership = user.memberships.find(
        (m) => m.membershipStatus === MembershipStatus.ACTIVE
      ) || user.memberships[0];

      if (primaryMembership) {
        const company = primaryMembership.company;
        companyRole = primaryMembership.role;
        companyContext = {
          id: company.id,
          name: company.name,
          slug: company.slug,
          status: company.status,
          role: primaryMembership.role,
          designation: primaryMembership.designation,
          department: primaryMembership.department,
        };

        if (company.status === CompanyStatus.PENDING) {
          redirectUrl = `/company/pending-approval?slug=${company.slug}`;
          accessStatus = 'PENDING_APPROVAL';
        } else if (company.status === CompanyStatus.REJECTED) {
          accessStatus = 'REJECTED';
          return NextResponse.json(
            {
              success: false,
              error: 'Your company registration was not approved. Please contact platform administration.',
              companyStatus: 'REJECTED',
            },
            { status: 403 }
          );
        } else if (company.status === CompanyStatus.SUSPENDED) {
          accessStatus = 'SUSPENDED';
          return NextResponse.json(
            {
              success: false,
              error: 'This company workspace has been suspended. Access is currently blocked.',
              companyStatus: 'SUSPENDED',
            },
            { status: 403 }
          );
        } else {
          // Company is ACTIVE
          if (primaryMembership.role === CompanyRole.COMPANY_ADMIN) {
            redirectUrl = `/c/${company.slug}/dashboard`;
          } else {
            redirectUrl = `/c/${company.slug}/my-tasks`;
          }
        }
      }
    }

    // 5. Issue JWT access token
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
      activeCompanyId: companyContext?.id || null,
      companyRole,
      companySlug: companyContext?.slug || null,
      designation: companyContext?.designation || null,
      department: companyContext?.department || null,
    });

    // 6. Issue rotating refresh token
    const { rawToken: refreshToken } = await createRefreshTokenSession(user.id);

    // 7. Audit successful login
    await recordAuditLog({
      actorUserId: user.id,
      companyId: companyContext?.id || null,
      action: 'AUTH_LOGIN_SUCCESS',
      targetType: 'USER',
      targetId: user.id,
      metadata: {
        globalRole: user.globalRole,
        companySlug: companyContext?.slug,
        redirectUrl,
      },
    });

    // 8. Build response and set HttpOnly cookies
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
        emailVerified: !!user.emailVerifiedAt,
        avatarUrl: user.avatarUrl,
      },
      company: companyContext,
      accessStatus,
      redirectUrl,
    });

    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error: any) {
    console.error('[API Login Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed due to a server error.' },
      { status: 500 }
    );
  }
}
