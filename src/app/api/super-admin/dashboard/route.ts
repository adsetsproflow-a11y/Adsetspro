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
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    // 3. Gather Dashboard Metrics
    const [statsRes, recentCompRes, auditRes] = await Promise.all([
      pool.query(`
        SELECT 
          (SELECT COUNT(*)::int FROM public.companies) as total_companies,
          (SELECT COUNT(*)::int FROM public.companies WHERE status = 'pending') as pending_approvals,
          (SELECT COUNT(*)::int FROM public.companies WHERE status = 'approved') as active_companies,
          (SELECT COUNT(*)::int FROM public.companies WHERE status = 'suspended') as suspended_companies,
          (SELECT COUNT(*)::int FROM public.profiles) as total_users;
      `),
      pool.query(`
        SELECT c.id, c.name, c.slug, c.status, c.created_at,
               json_build_object('full_name', p.full_name, 'email', p.email) as created_by_profile
        FROM public.companies c
        LEFT JOIN public.profiles p ON p.id = c.created_by
        ORDER BY c.created_at DESC
        LIMIT 5;
      `),
      pool.query(`
        SELECT id, action, target_type, target_id, details, created_at
        FROM public.audit_logs
        ORDER BY created_at DESC
        LIMIT 6;
      `),
    ]);

    const statsRow = statsRes.rows[0];

    return NextResponse.json({
      success: true,
      stats: {
        totalCompanies: statsRow?.total_companies || 0,
        pendingApprovals: statsRow?.pending_approvals || 0,
        activeCompanies: statsRow?.active_companies || 0,
        suspendedCompanies: statsRow?.suspended_companies || 0,
        totalUsers: statsRow?.total_users || 0,
      },
      recentCompanies: recentCompRes.rows,
      recentAuditEvents: auditRes.rows,
    });
  } catch (error: any) {
    console.error('Super Admin Dashboard API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
