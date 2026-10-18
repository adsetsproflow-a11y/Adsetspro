import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getDbPool } from '@/lib/db';

export async function DELETE(
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
          { error: 'Forbidden: Insufficient privileges to delete invitations.' },
          { status: 403 }
        );
      }
    }

    // 3. Delete invitation using direct DB pool or adminClient
    const pool = getDbPool();
    const delRes = await pool.query(
      `DELETE FROM public.invitations 
       WHERE id = $1 AND company_id = $2
       RETURNING id, email, full_name;`,
      [invitationId, company.id]
    );

    if (delRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invitation not found or already deleted.' },
        { status: 404 }
      );
    }

    const deletedInv = delRes.rows[0];

    // 4. Audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'INVITATION_DELETED',
      target_id: invitationId,
      target_type: 'invitation',
      details: { email: deletedInv.email, full_name: deletedInv.full_name },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation for ${deletedInv.email} has been permanently deleted.`,
    });
  } catch (error: any) {
    console.error('Delete invitation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
