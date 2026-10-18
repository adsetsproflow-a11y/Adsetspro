import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; taskId: string }> }
) {
  try {
    const { companySlug, taskId } = await params;
    const body = await request.json();
    const { employee_id: newEmployeeId, note } = body;

    if (!newEmployeeId) {
      return NextResponse.json({ error: 'New employee ID is required' }, { status: 400 });
    }

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

    // 3. Verify user permissions: Only admins or department heads can reassign
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role, status')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!membership || (membership.role !== 'COMPANY_ADMIN' && membership.role !== 'DEPARTMENT_HEAD')) {
        return NextResponse.json(
          { error: 'Forbidden: Only administrators or department heads can reassign tasks.' },
          { status: 403 }
        );
      }
    }

    // 4. Fetch task & target employee profile
    const { data: task, error: taskErr } = await adminClient
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('company_id', company.id)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { data: targetProfile, error: targetErr } = await adminClient
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', newEmployeeId)
      .single();

    if (targetErr || !targetProfile) {
      return NextResponse.json({ error: 'Target employee not found' }, { status: 404 });
    }

    // 5. Find current assignment
    const { data: currentAssignment } = await adminClient
      .from('task_assignments')
      .select('id, employee_id')
      .eq('task_id', taskId)
      .eq('is_current', true)
      .maybeSingle();

    if (currentAssignment?.employee_id === newEmployeeId) {
      return NextResponse.json(
        { message: 'Employee is already currently assigned to this task.' },
        { status: 200 }
      );
    }

    // 6. End old assignment: UPDATE task_assignments SET ended_at = NOW(), is_current = false
    if (currentAssignment) {
      await adminClient
        .from('task_assignments')
        .update({
          ended_at: new Date().toISOString(),
          is_current: false,
        })
        .eq('id', currentAssignment.id);
    }

    // 7. Insert new task_assignment
    const { data: newAssignment, error: assignErr } = await adminClient
      .from('task_assignments')
      .insert({
        task_id: taskId,
        employee_id: newEmployeeId,
        assigned_by: user.id,
        is_current: true,
      })
      .select('*')
      .single();

    if (assignErr) {
      throw assignErr;
    }

    // 8. Write to task_activities
    await adminClient.from('task_activities').insert({
      task_id: taskId,
      actor_id: user.id,
      action: 'TASK_REASSIGNED',
      details: {
        previous_employee_id: currentAssignment?.employee_id || null,
        new_employee_id: newEmployeeId,
        new_employee_name: targetProfile.full_name,
        assigned_by_name: profile?.full_name || 'Admin',
        note: note || null,
      },
    });

    // 9. Create notification for new assignee
    await adminClient.from('notifications').insert({
      user_id: newEmployeeId,
      company_id: company.id,
      type: 'TASK_ASSIGNED',
      title: 'Task Reassigned to You',
      body: `You have been assigned to task "${task.title}" by ${profile?.full_name || 'an administrator'}.`,
      payload: {
        task_id: taskId,
        project_id: task.project_id,
        department_id: task.department_id,
      },
    });

    // 10. Audit log
    await adminClient.from('audit_logs').insert({
      company_id: company.id,
      actor_id: user.id,
      action: 'TASK_REASSIGNED',
      target_type: 'task',
      target_id: taskId,
      details: {
        new_assignee: targetProfile.full_name,
        previous_assignee_id: currentAssignment?.employee_id || null,
      },
    });

    return NextResponse.json({
      success: true,
      assignment: newAssignment,
      message: `Task successfully reassigned to ${targetProfile.full_name}.`,
    });
  } catch (error: any) {
    console.error('Reassign task error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
