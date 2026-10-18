import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; projectId: string }> }
) {
  try {
    const { companySlug, projectId } = await params;
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

    // 3. Fetch project details
    const { data: project, error: projErr } = await adminClient
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        priority,
        start_date,
        due_date,
        created_at,
        updated_at,
        department_id,
        manager_id,
        department:departments!department_id(
          id,
          name
        ),
        manager:profiles!manager_id(
          id,
          full_name,
          email,
          avatar_url
        ),
        creator:profiles!created_by(
          id,
          full_name
        )
      `)
      .eq('id', projectId)
      .eq('company_id', company.id)
      .single();

    if (projErr || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 4. Fetch Tab 1 Tasks for this project
    const { data: rawTasks } = await adminClient
      .from('tasks')
      .select('id, title, status, priority, due_date, created_at, updated_at, department_id')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true, nullsFirst: false });

    const tasks = rawTasks || [];

    // Fetch department names for these tasks
    const deptIds = Array.from(new Set(tasks.map((t) => t.department_id).filter(Boolean))) as string[];
    let deptMap = new Map<string, string>();
    if (deptIds.length > 0) {
      const { data: depts } = await adminClient
        .from('departments')
        .select('id, name')
        .in('id', deptIds);
      (depts || []).forEach((d) => deptMap.set(d.id, d.name));
    }

    // Fetch assignees for these tasks
    const taskIds = tasks.map((t) => t.id);
    let assigneeMap = new Map<string, string>();
    let memberIdsSet = new Set<string>();

    if (project.manager_id) {
      memberIdsSet.add(project.manager_id);
    }

    let taskToEmployeeMap = new Map<string, string>();
    if (taskIds.length > 0) {
      const { data: rawAssignments } = await adminClient
        .from('task_assignments')
        .select('task_id, employee_id')
        .in('task_id', taskIds)
        .eq('is_current', true);

      (rawAssignments || []).forEach((a) => {
        if (a.employee_id) {
          memberIdsSet.add(a.employee_id);
          taskToEmployeeMap.set(a.task_id, a.employee_id);
        }
      });
    }

    // 5. Fetch Tab 2 Project Members & Assignee names
    let members: any[] = [];
    if (memberIdsSet.size > 0) {
      const { data: memberProfiles } = await adminClient
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', Array.from(memberIdsSet));

      const profileMap = new Map<string, string>();
      (memberProfiles || []).forEach((m) => {
        profileMap.set(m.id, m.full_name);
      });

      taskToEmployeeMap.forEach((empId, taskId) => {
        const name = profileMap.get(empId);
        if (name) {
          assigneeMap.set(taskId, name);
        }
      });

      members = (memberProfiles || []).map((m) => {
        const assignedTaskCount = Array.from(taskToEmployeeMap.values()).filter((id) => id === m.id).length;
        return {
          id: m.id,
          full_name: m.full_name,
          email: m.email,
          avatar_url: m.avatar_url,
          is_manager: m.id === project.manager_id,
          task_count: assignedTaskCount,
        };
      });
    }

    const tasksFormatted = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      created_at: t.created_at,
      department_name: (t.department_id && deptMap.get(t.department_id)) || 'General',
      assignee_name: assigneeMap.get(t.id) || 'Unassigned',
    }));

    // Real progress calculation: approved / non-cancelled * 100
    const nonCancelled = tasks.filter((t) => t.status !== 'cancelled');
    const approvedCount = tasks.filter((t) => t.status === 'approved').length;
    const progress =
      nonCancelled.length > 0 ? Math.round((approvedCount / nonCancelled.length) * 100) : 0;

    // 6. Fetch Tab 3 Activities
    const { data: activities } = await adminClient
      .from('audit_logs')
      .select(`
        id,
        action,
        target_type,
        details,
        created_at,
        actor:profiles!actor_id(full_name)
      `)
      .or(`target_id.eq.${projectId},company_id.eq.${company.id}`)
      .order('created_at', { ascending: false })
      .limit(15);

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        progress,
        total_tasks: nonCancelled.length,
        approved_tasks: approvedCount,
      },
      tasks: tasksFormatted,
      members,
      activities: activities || [],
    });
  } catch (error: any) {
    console.error('Fetch project detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; projectId: string }> }
) {
  try {
    const { companySlug, projectId } = await params;
    const body = await request.json();
    const { name, description, department_id, manager_id, start_date, due_date, status, priority } =
      body;

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
      .select('id')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Verify permissions
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
          { error: 'Forbidden: Admin authority required to edit projects' },
          { status: 403 }
        );
      }
    }

    // 4. Update fields
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (department_id !== undefined) updates.department_id = department_id || null;
    if (manager_id !== undefined) updates.manager_id = manager_id || null;
    if (start_date !== undefined) updates.start_date = start_date ? new Date(start_date).toISOString() : null;
    if (due_date !== undefined) updates.due_date = due_date ? new Date(due_date).toISOString() : null;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    updates.updated_at = new Date().toISOString();

    const { data: updated, error: updateErr } = await adminClient
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .eq('company_id', company.id)
      .select('*')
      .single();

    if (updateErr) {
      throw updateErr;
    }

    // 5. Audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'PROJECT_UPDATED',
      target_id: projectId,
      target_type: 'project',
      details: updates,
    });

    return NextResponse.json({
      success: true,
      project: updated,
      message: 'Project updated successfully.',
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; projectId: string }> }
) {
  try {
    const { companySlug, projectId } = await params;
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

      if (!membership || membership.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Only Company Administrators can archive projects' },
          { status: 403 }
        );
      }
    }

    // 3. Archive project
    const { data: archived, error: archErr } = await adminClient
      .from('projects')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('company_id', company.id)
      .select('*')
      .single();

    if (archErr) {
      throw archErr;
    }

    // 4. Audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'PROJECT_ARCHIVED',
      target_id: projectId,
      target_type: 'project',
      details: { project_name: archived.name },
    });

    return NextResponse.json({
      success: true,
      message: `Project "${archived.name}" has been archived.`,
    });
  } catch (error: any) {
    console.error('Archive project error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
