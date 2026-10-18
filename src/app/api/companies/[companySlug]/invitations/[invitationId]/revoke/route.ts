import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; invitationId: string }> }
) {
  try {
    const { companySlug, invitationId } = await params;
    const supabase = await createClient();

    // 1. Authenticate caller
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company & verify admin authority
    const { data: company } = await adminClient
      .from('companies')
      .select('id')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!membership || (membership.role !== 'COMPANY_ADMIN' && membership.role !== 'DEPARTMENT_HEAD')) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient privileges to revoke invitations.' },
          { status: 403 }
        );
      }
    }

    // 3. Update status = 'revoked'
    const { data: updated, error: updateErr } = await adminClient
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)
      .eq('company_id', company.id)
      .select('*')
      .single();

    if (updateErr) {
      throw updateErr;
    }

    // 4. Write to audit_logs
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'INVITATION_REVOKED',
      target_id: invitationId,
      target_type: 'invitation',
      details: { email: updated.email },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation for ${updated.email} has been revoked.`,
    });
  } catch (error: any) {
    console.error('Revoke invitation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
