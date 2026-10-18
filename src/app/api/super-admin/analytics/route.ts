import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
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
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const [compRes, profCountRes, taskRes, logRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int as count FROM public.companies;`),
      pool.query(`SELECT COUNT(*)::int as count FROM public.profiles;`),
      pool.query(`SELECT COUNT(*)::int as count FROM public.tasks;`),
      pool.query(`SELECT COUNT(*)::int as count FROM public.audit_logs;`),
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        totalCompanies: compRes.rows[0]?.count || 0,
        totalProfiles: profCountRes.rows[0]?.count || 0,
        activeTasks: taskRes.rows[0]?.count || 0,
        totalLogs: logRes.rows[0]?.count || 0,
      },
    });
  } catch (error: any) {
    console.error('Super Admin Analytics API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
