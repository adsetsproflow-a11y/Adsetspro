import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { verifyAccessToken } from './security/jwt';
import { GlobalRole, CompanyRole, CompanyStatus, AccountStatus, MembershipStatus } from '@prisma/client';

export interface AuthenticatedUserContext {
  userId: string;
  email: string;
  name: string;
  globalRole: GlobalRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  activeMembership?: {
    id: string;
    companyId: string;
    companyName: string;
    companySlug: string;
    companyStatus: CompanyStatus;
    role: CompanyRole;
    designation: string | null;
    department: string | null;
    membershipStatus: MembershipStatus;
  } | null;
}

/**
 * Extract and authenticate user from request (via Authorization header or Cookie)
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUserContext | null> {
  let token: string | undefined;

  // 1. Check Bearer token in header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Fallback to HttpOnly cookie
  if (!token) {
    token = request.cookies.get('saas_access_token')?.value || request.cookies.get('saas_auth_token')?.value;
  }

  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload || !payload.userId) return null;

  // Verify against active database record
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      memberships: {
        where: { membershipStatus: MembershipStatus.ACTIVE },
        include: { company: true },
      },
    },
  });

  if (!user || user.accountStatus !== AccountStatus.ACTIVE) {
    return null;
  }

  // Find matching active membership (prefer payload's activeCompanyId if specified)
  let activeMembership = null;
  if (user.memberships.length > 0) {
    const matched = payload.activeCompanyId
      ? user.memberships.find((m) => m.companyId === payload.activeCompanyId)
      : user.memberships[0];

    if (matched) {
      activeMembership = {
        id: matched.id,
        companyId: matched.companyId,
        companyName: matched.company.name,
        companySlug: matched.company.slug,
        companyStatus: matched.company.status,
        role: matched.role,
        designation: matched.designation,
        department: matched.department,
        membershipStatus: matched.membershipStatus,
      };
    }
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    globalRole: user.globalRole,
    accountStatus: user.accountStatus,
    emailVerified: !!user.emailVerifiedAt,
    activeMembership,
  };
}

/**
 * Guard: Enforce Super Admin permissions
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<{ user: AuthenticatedUserContext } | { response: NextResponse }> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in.' },
        { status: 401 }
      ),
    };
  }

  if (user.globalRole !== GlobalRole.SUPER_ADMIN) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Forbidden. Super Admin privileges required.' },
        { status: 403 }
      ),
    };
  }

  return { user };
}

/**
 * Guard: Enforce Active Company Admin permissions for a specific company slug
 */
export async function requireActiveCompanyAdmin(
  companySlug: string,
  request: NextRequest
): Promise<
  | { user: AuthenticatedUserContext; company: { id: string; name: string; slug: string; status: CompanyStatus } }
  | { response: NextResponse }
> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in.' },
        { status: 401 }
      ),
    };
  }

  // Find target company by slug
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
  });

  if (!company) {
    return {
      response: NextResponse.json({ success: false, error: 'Company workspace not found.' }, { status: 404 }),
    };
  }

  // Super Admin bypass for read/audit access
  if (user.globalRole === GlobalRole.SUPER_ADMIN) {
    return { user, company };
  }

  // Check company status: Must be ACTIVE
  if (company.status !== CompanyStatus.ACTIVE) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: `Company workspace access is restricted (Status: ${company.status}).`,
          companyStatus: company.status,
        },
        { status: 403 }
      ),
    };
  }

  // Check user membership in this exact company
  const membership = await prisma.companyMembership.findUnique({
    where: {
      userId_companyId: {
        userId: user.userId,
        companyId: company.id,
      },
    },
  });

  if (!membership || membership.membershipStatus !== MembershipStatus.ACTIVE) {
    return {
      response: NextResponse.json(
        { success: false, error: 'You are not an active member of this company workspace.' },
        { status: 403 }
      ),
    };
  }

  if (membership.role !== CompanyRole.COMPANY_ADMIN) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Administrative privileges required for this company operation.' },
        { status: 403 }
      ),
    };
  }

  return { user, company };
}

/**
 * Guard: Enforce Active Employee or Admin member access to a company workspace
 */
export async function requireActiveEmployee(
  companySlug: string,
  request: NextRequest
): Promise<
  | {
      user: AuthenticatedUserContext;
      company: { id: string; name: string; slug: string; status: CompanyStatus };
      membership: { role: CompanyRole; designation: string | null; department: string | null };
    }
  | { response: NextResponse }
> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in.' },
        { status: 401 }
      ),
    };
  }

  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
  });

  if (!company) {
    return {
      response: NextResponse.json({ success: false, error: 'Company workspace not found.' }, { status: 404 }),
    };
  }

  if (company.status !== CompanyStatus.ACTIVE && user.globalRole !== GlobalRole.SUPER_ADMIN) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: `Company workspace is currently ${company.status}. Operations are locked.`,
          companyStatus: company.status,
        },
        { status: 403 }
      ),
    };
  }

  const membership = await prisma.companyMembership.findUnique({
    where: {
      userId_companyId: {
        userId: user.userId,
        companyId: company.id,
      },
    },
  });

  if (!membership || membership.membershipStatus !== MembershipStatus.ACTIVE) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Access denied. You do not belong to this company workspace.' },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    company,
    membership: {
      role: membership.role,
      designation: membership.designation,
      department: membership.department,
    },
  };
}

/**
 * Task Access Isolation Guard:
 * Verify employee has permission to view/update the task
 */
export async function verifyTaskAccess(
  userId: string,
  companyId: string,
  taskId: string
): Promise<boolean> {
  // 1. Check user membership role
  const membership = await prisma.companyMembership.findUnique({
    where: {
      userId_companyId: { userId, companyId },
    },
  });

  if (!membership || membership.membershipStatus !== MembershipStatus.ACTIVE) {
    return false;
  }

  // Company Admin can access any task in their company
  if (membership.role === CompanyRole.COMPANY_ADMIN) {
    const taskInCompany = await prisma.task.findFirst({
      where: { id: taskId, companyId },
      select: { id: true },
    });
    return !!taskInCompany;
  }

  // Employee can only access tasks assigned to them or created by them
  const assignment = await prisma.taskAssignment.findFirst({
    where: {
      taskId,
      companyId,
      assignedUserId: userId,
    },
  });

  if (assignment) return true;

  const createdTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      companyId,
      createdById: userId,
    },
  });

  return !!createdTask;
}

/**
 * Record Security and Administrative Audit Log
 */
export async function recordAuditLog({
  actorUserId,
  companyId,
  action,
  targetType,
  targetId,
  metadata,
}: {
  actorUserId?: string | null;
  companyId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    // Sanitize metadata to never include sensitive credentials or tokens
    const cleanMeta = metadata ? { ...metadata } : {};
    delete cleanMeta.password;
    delete cleanMeta.passwordHash;
    delete cleanMeta.token;
    delete cleanMeta.tokenHash;
    delete cleanMeta.rawToken;

    await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId || null,
        companyId: companyId || null,
        action,
        targetType,
        targetId: targetId || null,
        metadata: Object.keys(cleanMeta).length > 0 ? JSON.stringify(cleanMeta) : null,
      },
    });
  } catch (err) {
    console.warn('Failed to record audit log:', err);
  }
}
