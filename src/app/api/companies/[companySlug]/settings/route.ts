import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { getDbPool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company with logo_url
    const pool = getDbPool();
    const compRes = await pool.query(
      `SELECT id, name, slug, status, logo_url, created_at, updated_at
       FROM public.companies
       WHERE slug = $1
       LIMIT 1;`,
      [companySlug]
    );

    if (compRes.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      company: compRes.rows[0],
    });
  } catch (error: any) {
    console.error('Fetch company settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const body = await request.json();
    const { name, logo_url } = body;

    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();

    // 2. Fetch company
    const compRes = await pool.query(
      `SELECT id, name FROM public.companies WHERE slug = $1 LIMIT 1;`,
      [companySlug]
    );

    if (compRes.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = compRes.rows[0];

    // 3. Verify admin authority
    const profRes = await pool.query(
      `SELECT is_super_admin FROM public.profiles WHERE id = $1 LIMIT 1;`,
      [user.id]
    );
    const profile = profRes.rows[0];

    if (!profile?.is_super_admin) {
      const memRes = await pool.query(
        `SELECT role FROM public.company_memberships 
         WHERE company_id = $1 AND user_id = $2 AND status = 'active' LIMIT 1;`,
        [company.id, user.id]
      );
      const membership = memRes.rows[0];

      if (!membership || membership.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required to update company settings' },
          { status: 403 }
        );
      }
    }

    // 4. Update company name and logo_url in database
    const updateRes = await pool.query(
      `UPDATE public.companies
       SET 
         name = COALESCE($1, name),
         logo_url = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE logo_url END,
         updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, slug, status, logo_url, created_at, updated_at;`,
      [name?.trim() || null, logo_url !== undefined ? logo_url : null, company.id]
    );

    return NextResponse.json({
      success: true,
      company: updateRes.rows[0],
      message: 'Workspace settings updated successfully.',
    });
  } catch (error: any) {
    console.error('Update company settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

