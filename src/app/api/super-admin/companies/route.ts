import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-helpers';
import { CompanyStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireSuperAdmin(request);
    if ('response' in authCheck) return authCheck.response;

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    let whereClause: any = {};
    if (statusParam && Object.values(CompanyStatus).includes(statusParam as CompanyStatus)) {
      whereClause.status = statusParam as CompanyStatus;
    }

    const companies = await prisma.company.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                emailVerifiedAt: true,
                accountStatus: true,
              },
            },
          },
        },
        _count: {
          select: {
            memberships: true,
            tasks: true,
            invitations: true,
          },
        },
      },
    });

    const formatted = companies.map((c) => {
      const adminMember = c.memberships.find((m) => m.role === 'COMPANY_ADMIN');
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        status: c.status,
        rejectionReason: c.rejectionReason,
        suspensionReason: c.suspensionReason,
        createdAt: c.createdAt,
        approvedAt: c.approvedAt,
        approvedBy: c.approvedBy,
        adminName: adminMember?.user.name || 'N/A',
        adminEmail: adminMember?.user.email || 'N/A',
        adminEmailVerified: !!adminMember?.user.emailVerifiedAt,
        employeeCount: c._count.memberships,
        taskCount: c._count.tasks,
        invitationCount: c._count.invitations,
        workspaceUrl: `/c/${c.slug}/dashboard`,
      };
    });

    return NextResponse.json({
      success: true,
      companies: formatted,
      total: formatted.length,
      counts: {
        all: formatted.length,
        pending: formatted.filter((c) => c.status === 'PENDING').length,
        active: formatted.filter((c) => c.status === 'ACTIVE').length,
        rejected: formatted.filter((c) => c.status === 'REJECTED').length,
        suspended: formatted.filter((c) => c.status === 'SUSPENDED').length,
      },
    });
  } catch (error: any) {
    console.error('[API Super Admin Companies Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching companies.' },
      { status: 500 }
    );
  }
}
