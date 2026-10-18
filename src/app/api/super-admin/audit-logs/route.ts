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
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = `
      SELECT al.id, al.action, al.target_type, al.target_id, al.actor_id, al.company_id, al.details, al.created_at,
             json_build_object('full_name', p.full_name, 'email', p.email) as actor
      FROM public.audit_logs al
      LEFT JOIN public.profiles p ON p.id = al.actor_id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (action && action !== 'all') {
      params.push(action);
      conditions.push(`al.action = $${params.length}`);
    }

    if (startDate) {
      params.push(new Date(startDate).toISOString());
      conditions.push(`al.created_at >= $${params.length}`);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      params.push(end.toISOString());
      conditions.push(`al.created_at <= $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY al.created_at DESC LIMIT 200;`;

    const logsRes = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      logs: logsRes.rows,
    });
  } catch (error: any) {
    console.error('Super Admin audit logs API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
