import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireSuperAdmin(request);
    if ('response' in authCheck) return authCheck.response;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
        company: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('[API Super Admin Audit Logs Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching audit logs.' },
      { status: 500 }
    );
  }
}
