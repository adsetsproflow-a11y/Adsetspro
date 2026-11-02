import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

    // 1. Authenticate user (Supabase or session cookie fallback)
    let user: any = null;
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;
    } catch {}

    if (!user) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('saaa_session')?.value;
      if (sessionCookie) {
        try {
          const raw = sessionCookie.includes('%') ? decodeURIComponent(sessionCookie) : sessionCookie;
          const decoded = Buffer.from(raw, 'base64').toString('utf8');
          const parsed = JSON.parse(decoded);
          if (parsed?.id) user = parsed;
        } catch {}
      }
    }

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

    // 3. Fetch company
    const compRes = await pool.query(
      `SELECT id, name, slug, member_limit, status FROM public.companies WHERE id = $1 LIMIT 1;`,
      [companyId]
    );

    if (compRes.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = compRes.rows[0];
    const previousLimit = Number(company.member_limit) || 5;

    // 4. Parse increment or targetLimit amount (supports negative numbers for reducing seats)
    let increment: number | null = null;
    let targetLimit: number | null = null;

    try {
      const body = await request.json();
      if (typeof body.increment === 'number' && Number.isFinite(body.increment)) {
        increment = Math.trunc(body.increment);
      }
      if (typeof body.targetLimit === 'number' && Number.isFinite(body.targetLimit)) {
        targetLimit = Math.trunc(body.targetLimit);
      }
    } catch {
      // Body was empty or invalid JSON; use default +5
    }

    if (increment === null && targetLimit === null) {
      increment = 5;
    }

    const newLimit = targetLimit !== null ? targetLimit : previousLimit + (increment ?? 0);
    const effectiveChange = newLimit - previousLimit;

    if (effectiveChange === 0) {
      return NextResponse.json(
        { error: 'No change made: target capacity is identical to current capacity.' },
        { status: 400 }
      );
    }

    if (newLimit < 1) {
      return NextResponse.json(
        { error: 'Seat capacity cannot be reduced below 1 seat.' },
        { status: 400 }
      );
    }

    // 5. Check active members to ensure capacity doesn't drop below active usage
    const activeRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM public.company_memberships WHERE company_id = $1 AND status = 'active';`,
      [companyId]
    );
    const activeCount = Number(activeRes.rows[0]?.count || 0);

    if (newLimit < activeCount) {
      return NextResponse.json(
        {
          error: `Cannot reduce seat capacity to ${newLimit}. Organization "${company.name}" has ${activeCount} active member(s). Maximum allowable reduction is ${Math.max(0, previousLimit - activeCount)} seats.`,
          activeCount,
          currentLimit: previousLimit,
          maxReduction: Math.max(0, previousLimit - activeCount),
        },
        { status: 400 }
      );
    }

    // 6. Update database
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

    // 7. Record in audit logs
    const auditAction = effectiveChange > 0 ? 'COMPANY_SEATS_INCREASED' : 'COMPANY_SEATS_DECREASED';
    await pool.query(
      `INSERT INTO public.audit_logs (actor_id, company_id, action, target_type, target_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW());`,
      [
        user.id,
        company.id,
        auditAction,
        'company',
        company.id,
        JSON.stringify({
          company_name: company.name,
          previous_limit: previousLimit,
          change: effectiveChange,
          new_limit: newLimit,
          active_members: activeCount,
          updated_by: user.id,
        }),
      ]
    );

    const message =
      effectiveChange > 0
        ? `Successfully allocated +${effectiveChange} seats to "${company.name}". Total capacity is now ${newLimit} members.`
        : `Successfully reduced ${Math.abs(effectiveChange)} seats from "${company.name}". Total capacity is now ${newLimit} members.`;

    return NextResponse.json({
      success: true,
      company: updatedCompany,
      previousLimit,
      newLimit,
      increment: effectiveChange,
      message,
    });
  } catch (error: any) {
    console.error('Adjust seats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while adjusting seats.' },
      { status: 500 }
    );
  }
}
