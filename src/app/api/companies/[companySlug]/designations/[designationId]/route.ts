import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; designationId: string }> }
) {
  try {
    const { companySlug, designationId } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company
    const { data: company, error: compErr } = await adminClient
      .from('companies')
      .select('id')
      .eq('slug', companySlug)
      .single();

    if (compErr || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Verify admin authority
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

      if (!membership || membership.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required to delete designations' },
          { status: 403 }
        );
      }
    }

    // 4. Verify designation belongs to this company
    const { data: designation } = await adminClient
      .from('designations')
      .select('id, name')
      .eq('id', designationId)
      .eq('company_id', company.id)
      .single();

    if (!designation) {
      return NextResponse.json({ error: 'Designation not found' }, { status: 404 });
    }

    // 5. Verify designation is UNUSED (not assigned to active employee or pending invitation)
    const [{ count: memberCount }, { count: invitationCount }] = await Promise.all([
      adminClient
        .from('department_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('designation_id', designationId),
      adminClient
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('designation_id', designationId)
        .eq('status', 'pending'),
    ]);

    if ((memberCount || 0) > 0 || (invitationCount || 0) > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete designation "${designation.name}". It is currently assigned to ${
            memberCount || 0
          } employee(s) and ${invitationCount || 0} pending invitation(s). Reassign them first.`,
        },
        { status: 400 }
      );
    }

    // 6. Delete designation
    const { error: delErr } = await adminClient
      .from('designations')
      .delete()
      .eq('id', designationId);

    if (delErr) throw delErr;

    return NextResponse.json({
      success: true,
      message: `Designation "${designation.name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Delete designation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
