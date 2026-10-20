import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { ensureTaskChatRoom } from '@/lib/chat/rooms';
import { getDbPool } from '@/lib/db';

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

    // 2 & 3. Fetch company and user profile in parallel
    const [companyRes, profileRes] = await Promise.all([
      adminClient.from('companies').select('id, name').eq('slug', companySlug).single(),
      adminClient.from('profiles').select('is_super_admin').eq('id', user.id).single(),
    ]);

    const company = companyRes.data;
    if (!company) {
      return NextResponse.json({ error: 'Company workspace not found' }, { status: 404 });
    }

    const profile = profileRes.data;
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
    const deptIds = Array.from(new Set(tasks.map((t) => t.department_id).filter(Boolean))) as string[];
    const projIds = Array.from(new Set(tasks.map((t) => t.project_id).filter(Boolean))) as string[];

    // 5 & 6. Parallel Batch Fetch: Assignments, Departments, and Projects
    const [assignmentsRes, deptsRes, projsRes] = await Promise.all([
      taskIds.length > 0
        ? adminClient.from('task_assignments').select('task_id, employee_id').in('task_id', taskIds).eq('is_current', true)
        : Promise.resolve({ data: [] }),
      deptIds.length > 0
        ? adminClient.from('departments').select('id, name').in('id', deptIds)
        : Promise.resolve({ data: [] }),
      projIds.length > 0
        ? adminClient.from('projects').select('id, name').in('id', projIds)
        : Promise.resolve({ data: [] }),
    ]);

    const assignments = assignmentsRes.data || [];
    const empIds = Array.from(new Set(assignments.map((a: any) => a.employee_id)));

    if (empIds.length > 0) {
      const { data: empProfiles } = await adminClient
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', empIds);

      const empMap = new Map<string, { full_name: string; avatar_url: string | null }>();
      (empProfiles || []).forEach((p: any) => empMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url }));

      assignments.forEach((a: any) => {
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

    let deptMap = new Map<string, string>();
    (deptsRes.data || []).forEach((d: any) => deptMap.set(d.id, d.name));

    let projMap = new Map<string, string>();
    (projsRes.data || []).forEach((p: any) => projMap.set(p.id, p.name));

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

    const pool = getDbPool();

    // 2. Fetch company
    const compRes = await pool.query(
      'SELECT id, name, slug FROM companies WHERE slug = $1 LIMIT 1',
      [companySlug]
    );
    const company = compRes.rows[0];

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Verify permissions: Active company members or super admin can create tasks
    const profRes = await pool.query(
      'SELECT id, is_super_admin, full_name FROM profiles WHERE id = $1 LIMIT 1',
      [user.id]
    );
    const profile = profRes.rows[0];

    let actorRole = 'EMPLOYEE';
    if (!profile?.is_super_admin) {
      const memRes = await pool.query(
        'SELECT id, role, status FROM company_memberships WHERE company_id = $1 AND user_id = $2 AND status = $3 LIMIT 1',
        [company.id, user.id, 'active']
      );
      const membership = memRes.rows[0];

      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden: Active workspace membership required to create tasks.' },
          { status: 403 }
        );
      }
      actorRole = membership.role;
    } else {
      actorRole = 'SUPER_ADMIN';
    }

    // 4. Validate assignee is not super admin and is a valid active tenant member
    const { data: assigneeProfile } = await adminClient
      .from('profiles')
      .select('id, is_super_admin')
      .eq('id', assignee_id)
      .single();

    if (!assigneeProfile || assigneeProfile.is_super_admin) {
      return NextResponse.json(
        { error: 'Invalid assignee: Platform Super Admin cannot be assigned tasks.' },
        { status: 400 }
      );
    }

    const { data: assigneeMem } = await adminClient
      .from('company_memberships')
      .select('id')
      .eq('company_id', company.id)
      .eq('user_id', assignee_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!assigneeMem) {
      return NextResponse.json(
        { error: 'Invalid assignee: User is not an active member of this organization.' },
        { status: 400 }
      );
    }

    // 5. Resolve reviewer: defaults to department head or company admin
    let finalReviewerId = reviewer_id || null;
    if (finalReviewerId) {
      const { data: revProfile } = await adminClient
        .from('profiles')
        .select('id, is_super_admin')
        .eq('id', finalReviewerId)
        .single();
      if (revProfile?.is_super_admin) {
        return NextResponse.json(
          { error: 'Invalid reviewer: Platform Super Admin cannot review organization tasks.' },
          { status: 400 }
        );
      }
    } else if (department_id) {
      const { data: dept } = await adminClient
        .from('departments')
        .select('head_user_id')
        .eq('id', department_id)
        .maybeSingle();
      if (dept?.head_user_id) {
        finalReviewerId = dept.head_user_id;
      }
    }

    if (!finalReviewerId || (profile?.is_super_admin && finalReviewerId === user.id)) {
      // Find company admin
      const { data: compAdmin } = await adminClient
        .from('company_memberships')
        .select('user_id')
        .eq('company_id', company.id)
        .eq('role', 'COMPANY_ADMIN')
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      finalReviewerId = compAdmin?.user_id || user.id;
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

    // 8. Create notifications for assignee and department head
    const taskNotifs: any[] = [];

    if (assignee_id && assignee_id !== user.id) {
      taskNotifs.push({
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
    }

    if (newTask.department_id) {
      const { data: dept } = await adminClient
        .from('departments')
        .select('head_user_id, name')
        .eq('id', newTask.department_id)
        .single();
      if (dept?.head_user_id && dept.head_user_id !== user.id && dept.head_user_id !== assignee_id) {
        taskNotifs.push({
          user_id: dept.head_user_id,
          company_id: company.id,
          type: 'TASK_ASSIGNED',
          title: `New Task in ${dept.name || 'Department'}`,
          body: `Task "${newTask.title}" was created and assigned to a team member.`,
          payload: {
            task_id: newTask.id,
            project_id: newTask.project_id,
            department_id: newTask.department_id,
          },
        });
      }
    }

    if (taskNotifs.length > 0) {
      await adminClient.from('notifications').insert(taskNotifs);
    }

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
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

    // 3. Verify user permissions (Admin or Super Admin required for bulk/clear-all)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    let isAuthorized = Boolean(profile?.is_super_admin);
    let userRole = profile?.is_super_admin ? 'SUPER_ADMIN' : 'EMPLOYEE';

    if (!isAuthorized) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership?.role === 'COMPANY_ADMIN' || membership?.role === 'DEPARTMENT_HEAD') {
        isAuthorized = true;
        userRole = membership.role;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required to bulk delete or clear tasks.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { taskIds, clearAll } = body;

    if (clearAll === true) {
      if (userRole !== 'COMPANY_ADMIN' && userRole !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Only Company Admins can clear all company tasks.' },
          { status: 403 }
        );
      }

      // Count tasks before deleting
      const { count } = await adminClient
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id);

      const { error: deleteErr } = await adminClient
        .from('tasks')
        .delete()
        .eq('company_id', company.id);

      if (deleteErr) throw deleteErr;

      return NextResponse.json({
        success: true,
        count: count || 0,
        message: `Successfully cleared all ${count || 0} tasks for ${company.name}.`,
      });
    }

    if (Array.isArray(taskIds) && taskIds.length > 0) {
      const { error: deleteErr } = await adminClient
        .from('tasks')
        .delete()
        .in('id', taskIds)
        .eq('company_id', company.id);

      if (deleteErr) throw deleteErr;

      return NextResponse.json({
        success: true,
        count: taskIds.length,
        message: `Successfully deleted ${taskIds.length} task(s).`,
      });
    }

    return NextResponse.json(
      { error: 'Bad Request: Please provide either taskIds or clearAll: true.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Bulk delete tasks error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

