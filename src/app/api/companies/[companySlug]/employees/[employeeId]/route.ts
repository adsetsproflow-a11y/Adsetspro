import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; employeeId: string }> }
) {
  try {
    const { companySlug, employeeId } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company
    const { data: company } = await adminClient
      .from('companies')
      .select('id, name')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Fetch employee profile & company membership
    const [{ data: profile }, { data: membership }] = await Promise.all([
      adminClient
        .from('profiles')
        .select('*')
        .eq('id', employeeId)
        .single(),
      adminClient
        .from('company_memberships')
        .select('*')
        .eq('company_id', company.id)
        .eq('user_id', employeeId)
        .single(),
    ]);

    if (!profile || !membership) {
      return NextResponse.json({ error: 'Employee not found in this organization' }, { status: 404 });
    }

    // 4. Fetch department memberships
    const { data: deptMemberships } = await adminClient
      .from('department_memberships')
      .select(`
        id,
        status,
        created_at,
        department:departments!department_id(id, name),
        designation:designations!designation_id(id, name),
        reporting_to_profile:profiles!reporting_to(id, full_name, email)
      `)
      .eq('user_id', employeeId);

    // 5. Fetch assigned tasks
    const { data: assignmentsData } = await adminClient
      .from('task_assignments')
      .select('task_id, is_current, assigned_at')
      .eq('employee_id', employeeId)
      .order('assigned_at', { ascending: false });

    const assignments = assignmentsData || [];
    const taskIds = assignments.map((a) => a.task_id);

    let tasksMap = new Map<string, any>();
    if (taskIds.length > 0) {
      const { data: taskRecords } = await adminClient
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          created_at,
          updated_at,
          department:departments!department_id(name),
          project:projects!project_id(name)
        `)
        .in('id', taskIds);

      (taskRecords || []).forEach((t: any) => {
        tasksMap.set(t.id, t);
      });
    }

    const currentTasks = assignments
      .filter((a) => {
        const t = tasksMap.get(a.task_id);
        return a.is_current && t && t.status !== 'approved' && t.status !== 'cancelled';
      })
      .map((a) => {
        const t = tasksMap.get(a.task_id);
        return {
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          due_date: t.due_date,
          department_name: t.department?.name || 'General',
          project_name: t.project?.name || 'General',
          assigned_at: a.assigned_at,
        };
      });

    const taskHistory = assignments
      .filter((a) => tasksMap.has(a.task_id))
      .map((a) => {
        const t = tasksMap.get(a.task_id);
        return {
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          due_date: t.due_date,
          is_current: a.is_current,
          completed_at: t.status === 'approved' ? t.updated_at : null,
        };
      });

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
        account_status: profile.account_status,
        role: membership.role,
        membership_status: membership.status,
        created_at: profile.created_at,
        joined_at: membership.created_at,
      },
      departments: deptMemberships || [],
      current_tasks: currentTasks,
      task_history: taskHistory,
    });
  } catch (error: any) {
    console.error('Fetch employee detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; employeeId: string }> }
) {
  try {
    const { companySlug, employeeId } = await params;
    const body = await request.json();
    const { status, role } = body;

    const supabase = await createClient();

    // 1. Authenticate caller
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
          { error: 'Forbidden: Admin authority required to manage employee status' },
          { status: 403 }
        );
      }
    }

    // 3. Update company_memberships
    const updates: any = {};
    if (status) updates.status = status;
    if (role) updates.role = role;
    updates.updated_at = new Date().toISOString();

    const { data: updatedMem, error: memErr } = await adminClient
      .from('company_memberships')
      .update(updates)
      .eq('company_id', company.id)
      .eq('user_id', employeeId)
      .select('*')
      .single();

    if (memErr) {
      throw memErr;
    }

    // Also sync account_status on profile if suspended/deactivated/active
    if (status && ['active', 'suspended', 'deactivated'].includes(status)) {
      await adminClient
        .from('profiles')
        .update({ account_status: status as any })
        .eq('id', employeeId);
    }

    // 4. Audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'EMPLOYEE_STATUS_CHANGED',
      target_id: employeeId,
      target_type: 'employee',
      details: updates,
    });

    return NextResponse.json({
      success: true,
      membership: updatedMem,
      message: `Employee status successfully updated to "${status}".`,
    });
  } catch (error: any) {
    console.error('Update employee status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
