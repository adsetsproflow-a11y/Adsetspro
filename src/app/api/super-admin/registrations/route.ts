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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    let query = `
      SELECT cr.id, cr.company_name, cr.company_slug, cr.company_id, cr.full_name, cr.email, cr.phone, cr.status, cr.created_at,
             c.status as current_company_status,
             (CASE WHEN c.id IS NOT NULL THEN true ELSE false END) as is_company_active
      FROM public.company_registrations cr
      LEFT JOIN public.companies c ON c.id = cr.company_id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`cr.status = $${params.length}`);
    }

    if (search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(
        LOWER(cr.company_name) LIKE $${params.length} OR
        LOWER(cr.full_name) LIKE $${params.length} OR
        LOWER(cr.email) LIKE $${params.length} OR
        cr.phone LIKE $${params.length} OR
        LOWER(COALESCE(cr.company_slug, '')) LIKE $${params.length}
      )`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY cr.created_at DESC LIMIT 200;`;

    const res = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      registrations: res.rows,
    });
  } catch (error: any) {
    console.error('Super Admin registrations API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();

    const profRes = await pool.query(
      `SELECT is_super_admin FROM public.profiles WHERE id = $1 LIMIT 1;`,
      [user.id]
    );

    if (!profRes.rows[0]?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      await pool.query(`DELETE FROM public.company_registrations;`);
      return NextResponse.json({ success: true, message: 'All company registrations deleted' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing registration id' }, { status: 400 });
    }

    await pool.query(`DELETE FROM public.company_registrations WHERE id = $1;`, [id]);

    return NextResponse.json({ success: true, message: 'Company registration deleted successfully' });
  } catch (error: any) {
    console.error('Super Admin registrations delete API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

