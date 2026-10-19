import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; departmentId: string }> }
) {
  try {
    const { companySlug, departmentId } = await params;
    const body = await request.json();
    const { head_user_id } = body;

    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company & verify admin permission
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

      if (membership?.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Admin authority required to assign department heads' },
          { status: 403 }
        );
      }
    }

    if (head_user_id) {
      const { data: targetProfile } = await adminClient
        .from('profiles')
        .select('is_super_admin')
        .eq('id', head_user_id)
        .single();

      if (targetProfile?.is_super_admin) {
        return NextResponse.json(
          { error: 'Platform Super Admin cannot be designated as a Department Head.' },
          { status: 400 }
        );
      }
    }

    // 3. Update department head
    const { data: updatedDept, error: deptErr } = await adminClient
      .from('departments')
      .update({
        head_user_id: head_user_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', departmentId)
      .eq('company_id', company.id)
      .select('*')
      .single();

    if (deptErr) {
      throw deptErr;
    }

    // 4. If assigning a user, elevate role & assign membership
    if (head_user_id) {
      // Update company membership role to DEPARTMENT_HEAD if currently EMPLOYEE
      await adminClient
        .from('company_memberships')
        .update({ role: 'DEPARTMENT_HEAD' })
        .eq('company_id', company.id)
        .eq('user_id', head_user_id)
        .eq('role', 'EMPLOYEE');

      // Ensure membership in this department
      await adminClient.from('department_memberships').upsert(
        {
          user_id: head_user_id,
          department_id: departmentId,
          status: 'active',
        },
        { onConflict: 'user_id, department_id' }
      );
    }

    // 5. Write to audit_logs
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'DEPARTMENT_HEAD_ASSIGNED',
      target_id: departmentId,
      target_type: 'department',
      details: {
        department_name: updatedDept.name,
        new_head_id: head_user_id || null,
      },
    });

    return NextResponse.json({
      success: true,
      department: updatedDept,
      message: head_user_id
        ? 'Department head assigned successfully.'
        : 'Department head unassigned.',
    });
  } catch (error: any) {
    console.error('Assign department head error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
