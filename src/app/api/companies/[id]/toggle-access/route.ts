import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { INITIAL_COMPANIES } from '@/lib/seed-data';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) {
      token = request.cookies.get('saas_auth_token')?.value;
    }

    if (token) {
      const payload = verifyJwt(token);
      if (payload && payload.role !== 'super_admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Only Super Admin can toggle company access.' },
          { status: 403 }
        );
      }
    }

    const company = INITIAL_COMPANIES.find((c) => c.id === id);
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found.' },
        { status: 404 }
      );
    }

    // Toggle active state
    company.is_active = !company.is_active;

    return NextResponse.json({
      success: true,
      companyId: id,
      is_active: company.is_active,
      message: `Access ${company.is_active ? 'ENABLED' : 'PAUSED'} for ${company.name} (${company.subdomain})`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating access.' },
      { status: 500 }
    );
  }
}
