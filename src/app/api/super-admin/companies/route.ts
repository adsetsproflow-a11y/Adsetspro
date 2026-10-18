import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();

    // 2. Verify Super Admin authority
    const profRes = await pool.query(
      `SELECT is_super_admin FROM public.profiles WHERE id = $1 LIMIT 1;`,
      [user.id]
    );

    if (!profRes.rows[0]?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let query = `
      SELECT c.id, c.name, c.slug, c.status, c.created_at, c.approved_at, c.rejected_at, c.reject_reason,
             json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email) as created_by_profile,
             (SELECT COUNT(*)::int FROM public.company_memberships cm WHERE cm.company_id = c.id) as member_count
      FROM public.companies c
      LEFT JOIN public.profiles p ON p.id = c.created_by
    `;

    const params: any[] = [];
    if (statusFilter && statusFilter !== 'all') {
      params.push(statusFilter);
      query += ` WHERE c.status = $${params.length}`;
    }

    query += ` ORDER BY c.created_at DESC;`;

    const compRes = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      companies: compRes.rows,
    });
  } catch (error: any) {
    console.error('Super Admin companies API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
