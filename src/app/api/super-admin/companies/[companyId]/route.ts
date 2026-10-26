import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { getDbPool } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const supabase = await createClient();

    // 1. Authenticate user session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();

    // 2. Verify Super Administrator authority
    const profRes = await pool.query(
      `SELECT is_super_admin FROM public.profiles WHERE id = $1 LIMIT 1;`,
      [user.id]
    );

    if (!profRes.rows[0]?.is_super_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Super administrator credentials required to delete organizations.' },
        { status: 403 }
      );
    }

    // 3. Fetch company
    const compRes = await pool.query(
      `SELECT id, name, slug, status FROM public.companies WHERE id = $1 LIMIT 1;`,
      [companyId]
    );

    if (compRes.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    const company = compRes.rows[0];

    // 4. Verify company is in suspended status before deletion
    if (company.status !== 'suspended') {
      return NextResponse.json(
        { error: 'Organization must be in suspended status before it can be permanently deleted.' },
        { status: 400 }
      );
    }

    // 5. Record deletion in platform audit log
    await pool.query(
      `INSERT INTO public.audit_logs (actor_id, company_id, action, target_type, target_id, details, created_at)
       VALUES ($1, NULL, $2, $3, $4, $5, NOW());`,
      [
        user.id,
        'COMPANY_DELETED',
        'company',
        company.id,
        JSON.stringify({
          company_name: company.name,
          company_slug: company.slug,
          previous_status: company.status,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        }),
      ]
    );

    // 6. Delete company from database (cascades all memberships, tasks, departments, projects, chat, files)
    await pool.query(`DELETE FROM public.companies WHERE id = $1;`, [company.id]);

    // Supabase client sync
    try {
      await adminClient.from('companies').delete().eq('id', company.id);
    } catch (syncErr) {
      console.warn('Supabase client delete sync warning:', syncErr);
    }

    return NextResponse.json({
      success: true,
      message: `Organization "${company.name}" and all associated workspace records have been permanently deleted.`,
    });
  } catch (error: any) {
    console.error('Delete company error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while deleting company.' },
      { status: 500 }
    );
  }
}
