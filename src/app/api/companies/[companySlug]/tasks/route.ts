import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { ensureTaskChatRoom } from '@/lib/chat/rooms';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const url = new URL(request.url);

    // Query parameters
    const statusFilter = url.searchParams.get('status');
    const priorityFilter = url.searchParams.get('priority');
    const departmentFilter = url.searchParams.get('department_id');
    const assigneeFilter = url.searchParams.get('assignee_id');
    const projectFilter = url.searchParams.get('project_id');
    const searchQuery = url.searchParams.get('search');
    const startDateFilter = url.searchParams.get('startDate');
    const endDateFilter = url.searchParams.get('endDate');

    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

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
      return NextResponse.json({ error: 'Company workspace not found' }, { status: 404 });
    }

    // 3. Verify user membership
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    let userRole = 'EMPLOYEE';
    if (!profile?.is_super_admin) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role, status')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden: Active membership required' },
          { status: 403 }
        );
      }
      userRole = membership.role;
    } else {
      userRole = 'SUPER_ADMIN';
    }

    // 4. Build task query
    let query = adminClient
      .from('tasks')
      .select('id, company_id, department_id, project_id, title, description, status, priority, start_date, due_date, reviewer_id, created_by, created_at, updated_at', { count: 'exact' })
      .eq('company_id', company.id);

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter as any);
    }

    if (priorityFilter && priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter as any);
    }

    if (departmentFilter && departmentFilter !== 'all') {
      query = query.eq('department_id', departmentFilter);
    }

    if (projectFilter && projectFilter !== 'all') {
      query = query.eq('project_id', projectFilter);
    }

    if (startDateFilter) {
      query = query.gte('due_date', new Date(startDateFilter).toISOString());
    }

    if (endDateFilter) {
      const end = new Date(endDateFilter);
      end.setHours(23, 59, 59, 999);
      query = query.lte('due_date', end.toISOString());
    }

    if (searchQuery && searchQuery.trim()) {
      query = query.ilike('title', `%${searchQuery.trim()}%`);
    }

    // Apply pagination and sort
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: rawTasks, count: totalCount, error: taskErr } = await query;

    if (taskErr) {
      throw taskErr;
    }

    const tasks = rawTasks || [];
    const taskIds = tasks.map((t) => t.id);

    // 5. Fetch current assignees for these tasks
    let taskAssigneeMap = new Map<string, { employee_id: string; full_name: string; avatar_url: string | null }>();
    if (taskIds.length > 0) {
      const { data: assignments } = await adminClient
        .from('task_assignments')
        .select('task_id, employee_id')
        .in('task_id', taskIds)
        .eq('is_current', true);

      const empIds = Array.from(new Set((assignments || []).map((a) => a.employee_id)));
      if (empIds.length > 0) {
        const { data: empProfiles } = await adminClient
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', empIds);

        const empMap = new Map<string, { full_name: string; avatar_url: string | null }>();
        (empProfiles || []).forEach((p) => empMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url }));

        (assignments || []).forEach((a) => {
          const emp = empMap.get(a.employee_id);
          if (emp) {
            taskAssigneeMap.set(a.task_id, {
              employee_id: a.employee_id,
              full_name: emp.full_name,
              avatar_url: emp.avatar_url,
            });
          }
        });
      }
    }

    // 6. Fetch departments and projects maps
    const deptIds = Array.from(new Set(tasks.map((t) => t.department_id).filter(Boolean))) as string[];
    const projIds = Array.from(new Set(tasks.map((t) => t.project_id).filter(Boolean))) as string[];

    let deptMap = new Map<string, string>();
    if (deptIds.length > 0) {
      const { data: depts } = await adminClient
        .from('departments')
        .select('id, name')
        .in('id', deptIds);
      (depts || []).forEach((d) => deptMap.set(d.id, d.name));
    }

    let projMap = new Map<string, string>();
    if (projIds.length > 0) {
      const { data: projs } = await adminClient
        .from('projects')
        .select('id, name')
        .in('id', projIds);
      (projs || []).forEach((p) => projMap.set(p.id, p.name));
    }

    // 7. Format task response
    let formattedTasks = tasks.map((t) => {
      const assignee = taskAssigneeMap.get(t.id);
      return {
        id: t.id,
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        start_date: t.start_date,
        due_date: t.due_date,
        created_at: t.created_at,
        updated_at: t.updated_at,
        department_id: t.department_id,
        department_name: (t.department_id && deptMap.get(t.department_id)) || 'General',
        project_id: t.project_id,
        project_name: (t.project_id && projMap.get(t.project_id)) || null,
        assignee_id: assignee?.employee_id || null,
        assignee_name: assignee?.full_name || 'Unassigned',
        assignee_avatar: assignee?.avatar_url || null,
      };
    });

    // If filtered by assignee_id, filter out non-matching tasks
    if (assigneeFilter && assigneeFilter !== 'all') {
      formattedTasks = formattedTasks.filter((t) => t.assignee_id === assigneeFilter);
    }

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      pagination: {
        total: totalCount || formattedTasks.length,
        page,
        limit,
        totalPages: Math.ceil((totalCount || formattedTasks.length) / limit),
      },
      userRole,
    });
  } catch (error: any) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const body = await request.json();
    const {
      title,
      description,
      department_id,
      project_id,
      assignee_id,
      reviewer_id,
      priority,
      start_date,
      due_date,
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Task description is required' }, { status: 400 });
    }

    if (!assignee_id) {
      return NextResponse.json({ error: 'Assignee is required' }, { status: 400 });
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

    // 3. Verify permissions: Only admin, dept head, or super admin can create tasks
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin, full_name')
      .eq('id', user.id)
      .single();

    let actorRole = 'EMPLOYEE';
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
          { error: 'Forbidden: Insufficient permissions to create tasks.' },
          { status: 403 }
        );
      }
      actorRole = membership.role;
    } else {
      actorRole = 'SUPER_ADMIN';
    }

    // 4. Resolve reviewer: defaults to department head or creator if not specified
    let finalReviewerId = reviewer_id || null;
    if (!finalReviewerId && department_id) {
      const { data: dept } = await adminClient
        .from('departments')
        .select('head_user_id')
        .eq('id', department_id)
        .maybeSingle();
      if (dept?.head_user_id) {
        finalReviewerId = dept.head_user_id;
      }
    }
    if (!finalReviewerId) {
      finalReviewerId = user.id;
    }

    // 5. Insert task
    const { data: newTask, error: taskErr } = await adminClient
      .from('tasks')
      .insert({
        company_id: company.id,
        department_id: department_id || null,
        project_id: project_id || null,
        title: title.trim(),
        description: description.trim(),
        status: 'assigned',
        priority: priority || 'medium',
        start_date: start_date ? new Date(start_date).toISOString() : null,
        due_date: due_date ? new Date(due_date).toISOString() : null,
        reviewer_id: finalReviewerId,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (taskErr || !newTask) {
      throw taskErr || new Error('Failed to create task');
    }

    // 6. Insert initial task assignment
    const { error: assignErr } = await adminClient.from('task_assignments').insert({
      task_id: newTask.id,
      employee_id: assignee_id,
      assigned_by: user.id,
      is_current: true,
    });

    if (assignErr) {
      console.error('Task assignment error:', assignErr);
    }

    // 7. Write to task_activities
    await adminClient.from('task_activities').insert({
      task_id: newTask.id,
      actor_id: user.id,
      action: 'TASK_CREATED',
      details: {
        title: newTask.title,
        priority: newTask.priority,
        assignee_id,
        reviewer_id: finalReviewerId,
        department_id: newTask.department_id,
        project_id: newTask.project_id,
      },
    });

    // 8. Create notification for assignee
    await adminClient.from('notifications').insert({
      user_id: assignee_id,
      company_id: company.id,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      body: `You have been assigned to task "${newTask.title}" by ${profile?.full_name || 'your manager'}.`,
      payload: {
        task_id: newTask.id,
        project_id: newTask.project_id,
        department_id: newTask.department_id,
      },
    });

    // 9. Write audit log
    await adminClient.from('audit_logs').insert({
      company_id: company.id,
      actor_id: user.id,
      action: 'TASK_CREATED',
      target_type: 'task',
      target_id: newTask.id,
      details: {
        title: newTask.title,
        priority: newTask.priority,
        assignee_id,
      },
    });

    // Auto-create task chat room & enroll assignee + reviewer + creator
    await ensureTaskChatRoom(
      newTask.id,
      company.id,
      newTask.title,
      assignee_id,
      finalReviewerId,
      user.id
    );

    return NextResponse.json({
      success: true,
      task: newTask,
      message: `Task "${newTask.title}" created and assigned successfully.`,
    });
  } catch (error: any) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
