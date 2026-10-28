import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { getDbPool } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
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
        { error: 'Forbidden: Super administrator authority required to adjust seat allocations.' },
        { status: 403 }
      );
    }

    // 3. Parse increment amount (default to 5 for +5 pack)
    let increment = 5;
    try {
      const body = await request.json();
      if (typeof body.increment === 'number' && body.increment > 0) {
        increment = Math.floor(body.increment);
      }
    } catch {
      // Body was empty or invalid JSON; use default 5
    }

    // 4. Fetch company
    const compRes = await pool.query(
      `SELECT id, name, slug, member_limit, status FROM public.companies WHERE id = $1 LIMIT 1;`,
      [companyId]
    );

    if (compRes.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = compRes.rows[0];
    const previousLimit = Number(company.member_limit) || 5;
    const newLimit = previousLimit + increment;

    // 5. Update database
    const updateRes = await pool.query(
      `UPDATE public.companies
       SET member_limit = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, slug, member_limit;`,
      [newLimit, companyId]
    );

    const updatedCompany = updateRes.rows[0];

    // Supabase sync
    try {
      await adminClient
        .from('companies')
        .update({ member_limit: newLimit } as any)
        .eq('id', companyId);
    } catch (syncErr) {
      console.warn('Supabase client sync warning:', syncErr);
    }

    // 6. Record in audit logs
    await pool.query(
      `INSERT INTO public.audit_logs (actor_id, company_id, action, target_type, target_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW());`,
      [
        user.id,
        company.id,
        'COMPANY_SEATS_INCREASED',
        'company',
        company.id,
        JSON.stringify({
          company_name: company.name,
          previous_limit: previousLimit,
          increment,
          new_limit: newLimit,
          updated_by: user.id,
        }),
      ]
    );

    return NextResponse.json({
      success: true,
      company: updatedCompany,
      previousLimit,
      newLimit,
      increment,
      message: `Successfully allocated +${increment} seats to "${company.name}". Total capacity is now ${newLimit} members.`,
    });
  } catch (error: any) {
    console.error('Add seats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while allocating seats.' },
      { status: 500 }
    );
  }
}
