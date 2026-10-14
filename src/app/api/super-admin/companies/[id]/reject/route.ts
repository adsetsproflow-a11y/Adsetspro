import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, recordAuditLog } from '@/lib/auth-helpers';
import { CompanyStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireSuperAdmin(request);
    if ('response' in authCheck) return authCheck.response;

    const { id } = await context.params;
    let reason = 'Application does not meet platform requirements';
    try {
      const body = await request.json();
      if (body.reason) reason = body.reason;
    } catch {}

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found.' }, { status: 404 });
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        status: CompanyStatus.REJECTED,
        rejectionReason: reason,
      },
    });

    await recordAuditLog({
      actorUserId: authCheck.user.userId,
      companyId: id,
      action: 'COMPANY_REJECTED',
      targetType: 'COMPANY',
      targetId: id,
      metadata: {
        companyName: company.name,
        companySlug: company.slug,
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Company "${updated.name}" registration has been rejected.`,
      company: updated,
    });
  } catch (error: any) {
    console.error('[API Reject Company Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error rejecting company.' },
      { status: 500 }
    );
  }
}
