import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const supabase = await createClient();

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

    const { data: company, error: fetchError } = await adminClient
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (fetchError || !company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await adminClient
      .from('companies')
      .update({
        status: 'approved',
      })
      .eq('id', companyId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Write to audit_logs
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: companyId,
      action: 'COMPANY_REACTIVATED',
      target_id: companyId,
      target_type: 'company',
      details: {
        company_name: company.name,
        slug: company.slug,
        reactivated_at: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Organization "${company.name}" reactivated.`,
    });
  } catch (error: any) {
    console.error('Company reactivation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
