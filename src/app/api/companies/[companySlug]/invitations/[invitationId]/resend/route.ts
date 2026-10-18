import { NextResponse } from 'next/server';
import crypto from 'crypto';
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
          { error: 'Forbidden: Insufficient privileges to resend invitations.' },
          { status: 403 }
        );
      }
    }

    // 3. Renew token & expiry
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: updated, error: updateErr } = await adminClient
      .from('invitations')
      .update({
        token_hash: tokenHash,
        expires_at: newExpiresAt,
        status: 'pending',
      })
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
      action: 'INVITATION_RESENT',
      target_id: invitationId,
      target_type: 'invitation',
      details: { email: updated.email },
    });

    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${proto}://${host}`;
    const inviteUrl = `${baseUrl}/accept-invitation?token=${rawToken}`;
    console.log(`[ONBOARDING EMAIL] Resent Invitation for ${updated.email}: ${inviteUrl}`);

    return NextResponse.json({
      success: true,
      inviteUrl,
      message: `Invitation resent to ${updated.email}. Valid for another 7 days.`,
    });
  } catch (error: any) {
    console.error('Resend invitation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
