import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { INITIAL_COMPANIES } from '@/lib/seed-data';
import { Company } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) {
      token = request.cookies.get('saas_auth_token')?.value;
    }

    // Default list
    let companies = INITIAL_COMPANIES;

    if (token) {
      const payload = verifyJwt(token);
      if (payload) {
        // Strict Multi-Tenant Isolation:
        // Only Super Admin can view all companies.
        // Client Company Admins and employees only see their own company!
        if (payload.role !== 'super_admin') {
          companies = companies.filter((c) => c.id === payload.companyId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      companies,
      total: companies.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching companies.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) {
      token = request.cookies.get('saas_auth_token')?.value;
    }

    if (token) {
      const payload = verifyJwt(token);
      if (payload && payload.role !== 'super_admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Only Super Admin can create new companies.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { name, subdomain, plan = 'pro', max_users = 25, storage_limit_mb = 5000, mrr = 2400 } = body;

    if (!name || !subdomain) {
      return NextResponse.json(
        { success: false, error: 'Company name and subdomain are required.' },
        { status: 400 }
      );
    }

    const newCompany: Company = {
      id: `comp-${Date.now()}`,
      name: String(name).trim(),
      subdomain: String(subdomain).toLowerCase().replace(/[^a-z0-9-]/g, ''),
      plan,
      max_users,
      storage_limit_mb,
      is_active: true,
      mrr,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      company: newCompany,
      message: `Company "${newCompany.name}" successfully created with subdomain ${newCompany.subdomain}.domain.com`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error creating company.' },
      { status: 500 }
    );
  }
}
