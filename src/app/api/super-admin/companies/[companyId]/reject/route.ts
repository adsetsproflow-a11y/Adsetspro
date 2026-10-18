import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const body = await request.json();
    const reason = body?.reason?.trim() || 'Application did not satisfy platform onboarding criteria.';

    const supabase = await createClient();

    // 1. Verify caller session and super admin authority
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Super administrator credentials required.' },
        { status: 403 }
      );
    }

    // 2. Fetch company to reject
    const { data: company, error: fetchError } = await adminClient
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (fetchError || !company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    // 3. Update companies status to rejected
    const now = new Date().toISOString();
    const { error: updateError } = await adminClient
      .from('companies')
      .update({
        status: 'rejected',
        rejected_at: now,
        reject_reason: reason,
      })
      .eq('id', companyId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 4. Create Notification for Company Admin
    const { data: adminMembership } = await adminClient
      .from('company_memberships')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('role', 'COMPANY_ADMIN')
      .limit(1)
      .maybeSingle();

    if (adminMembership?.user_id) {
      await adminClient.from('notifications').insert({
        user_id: adminMembership.user_id,
        company_id: companyId,
        type: 'company_rejected',
        title: 'Workspace Registration Declined',
        body: `Your organization registration for "${company.name}" was declined. Reason: ${reason}`,
        payload: {
          company_id: companyId,
          reason,
          rejected_at: now,
        },
      });
    }

    // 5. Write to audit_logs
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: companyId,
      action: 'COMPANY_REJECTED',
      target_id: companyId,
      target_type: 'company',
      details: {
        company_name: company.name,
        slug: company.slug,
        reason,
        rejected_at: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Organization "${company.name}" rejected.`,
    });
  } catch (error: any) {
    console.error('Company rejection error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
