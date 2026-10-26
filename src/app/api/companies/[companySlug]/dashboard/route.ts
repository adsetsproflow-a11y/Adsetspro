import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getDbPool } from '@/lib/db';

export async function GET(
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

    // 2. Fetch user profile with resilient fallback
    const pool = getDbPool();
    let profile: any = null;
    const profRes = await pool.query(
      `SELECT id, full_name, email, is_super_admin 
       FROM public.profiles 
       WHERE id = $1 OR (LOWER(email) = LOWER($2) AND $2 != '') 
       LIMIT 1;`,
      [user.id, user.email || '']
    );

    if (profRes.rows.length > 0) {
      profile = profRes.rows[0];
    } else {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member';
      try {
        const insertRes = await pool.query(
          `INSERT INTO public.profiles (id, full_name, email, is_super_admin)
           VALUES ($1, $2, $3, false)
           ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
           RETURNING id, full_name, email, is_super_admin;`,
          [user.id, name, user.email || '']
        );
        profile = insertRes.rows[0];
      } catch {
        profile = { id: user.id, full_name: name, email: user.email, is_super_admin: false };
      }
    }

    // 3. Fetch company
    const { data: company, error: companyErr } = await adminClient
      .from('companies')
      .select('id, name, slug, status')
      .eq('slug', companySlug)
      .single();

    if (companyErr || !company) {
      return NextResponse.json({ error: 'Organization workspace not found' }, { status: 404 });
    }

    // 4. Validate membership & approval status
    let userRole = 'EMPLOYEE';
    if (profile?.is_super_admin) {
      userRole = 'SUPER_ADMIN';
    } else {
      const effectiveUserId = profile?.id || user.id;
      const memRes = await pool.query(
        `SELECT role, status FROM public.company_memberships 
         WHERE company_id = $1 AND (user_id = $2 OR user_id = $3) AND status = 'active' 
         LIMIT 1;`,
        [company.id, user.id, effectiveUserId]
      );
      const membership = memRes.rows[0];

      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden: You are not an active member of this organization workspace.' },
          { status: 403 }
        );
      }

      if (company.status !== 'approved') {
        return NextResponse.json(
          { error: 'Forbidden: Organization workspace is pending approval or inactive.' },
          { status: 403 }
        );
      }

      userRole = membership.role;
    }

    // If department head, fetch their headed departments
    let headDeptIds: string[] = [];
    if (userRole === 'DEPARTMENT_HEAD') {
      const { data: headDepts } = await adminClient
        .from('departments')
        .select('id')
        .eq('company_id', company.id)
        .eq('head_user_id', user.id);
      headDeptIds = (headDepts || []).map((d) => d.id);
    }

    // 5. Gather raw metrics & employee workload aggregation concurrently
    const [
      { count: employeeCount },
      { count: departmentCount },
      { count: projectCount },
      { data: departments },
      { data: tasks },
      { data: taskAssignments },
      { data: recentAuditLogs },
      empWorkloadRes,
    ] = await Promise.all([
      adminClient
        .from('company_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('status', 'active'),
      adminClient
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('status', 'active'),
      adminClient
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('status', 'active'),
      adminClient
        .from('departments')
        .select('id, name')
        .eq('company_id', company.id),
      adminClient
        .from('tasks')
        .select('id, title, status, priority, due_date, department_id, created_at, updated_at')
        .eq('company_id', company.id),
      adminClient
        .from('task_assignments')
        .select(`
          task_id,
          employee:profiles!employee_id(full_name)
        `)
        .eq('is_current', true),
      adminClient
        .from('audit_logs')
        .select(`
          id,
          action,
          target_type,
          target_id,
          details,
          created_at,
          actor:profiles!actor_id(full_name)
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(8),
      pool.query(`
        SELECT 
          cm.user_id as employee_id,
          COALESCE(p.full_name, p.email) as full_name,
          p.avatar_url,
          p.email,
          dm.department_id,
          COALESCE(d.name, 'General') as department_name,
          t.id as task_id,
          t.title as task_title,
          t.priority as task_priority,
          t.project_id as task_project_id,
          t.status as task_status,
          t.due_date as task_due_date
        FROM public.company_memberships cm
        JOIN public.profiles p ON p.id = cm.user_id
        LEFT JOIN public.department_memberships dm ON dm.user_id = cm.user_id AND dm.status = 'active'
        LEFT JOIN public.departments d ON d.id = dm.department_id
        LEFT JOIN public.task_assignments ta ON ta.employee_id = cm.user_id AND ta.is_current = true
        LEFT JOIN public.tasks t ON t.id = ta.task_id AND t.company_id = cm.company_id
        WHERE cm.company_id = $1 AND cm.status = 'active'
        ORDER BY p.full_name ASC;
      `, [company.id]),
    ]);

    const allTasks = tasks || [];
    const deptMap = new Map((departments || []).map((d) => [d.id, d.name]));
    const assigneeMap = new Map(
      (taskAssignments || []).map((a: any) => [a.task_id, a.employee?.full_name || 'Unassigned'])
    );

    const now = new Date();
    const todayIso = now.toISOString();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Calculations
    let tasksAwaitingReview = 0;
    let inProgressTasks = 0;
    let overdueTasks = 0;
    let upcomingDeadlines = 0;
    let approvedThisMonth = 0;

    const statusCounts: Record<string, number> = {
      assigned: 0,
      in_progress: 0,
      submitted_for_review: 0,
      revision_required: 0,
      approved: 0,
      blocked: 0,
      cancelled: 0,
    };

    const priorityCounts: Record<string, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const deptWorkloadMap: Record<string, number> = {};
    (departments || []).forEach((d) => {
      deptWorkloadMap[d.name] = 0;
    });

    for (const task of allTasks) {
      const status = task.status;
      const priority = task.priority;

      // Status totals
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }

      // Priority totals
      if (priorityCounts[priority] !== undefined) {
        priorityCounts[priority]++;
      }

      // Department workload (exclude cancelled)
      if (status !== 'cancelled') {
        const deptName = task.department_id ? deptMap.get(task.department_id) || 'General' : 'General';
        deptWorkloadMap[deptName] = (deptWorkloadMap[deptName] || 0) + 1;
      }

      // Tasks Awaiting Review
      if (status === 'submitted_for_review') {
        tasksAwaitingReview++;
      }

      // In Progress Tasks
      if (status === 'in_progress') {
        inProgressTasks++;
      }

      // Approved This Month
      if (status === 'approved' && task.updated_at >= startOfMonth) {
        approvedThisMonth++;
      }

      // Overdue: due_date < TODAY AND status NOT IN (approved, cancelled)
      if (
        task.due_date &&
        task.due_date < todayIso &&
        status !== 'approved' &&
        status !== 'cancelled'
      ) {
        overdueTasks++;
      }

      // Upcoming Deadlines: next 7 days AND status NOT IN (approved, cancelled)
      if (
        task.due_date &&
        task.due_date >= todayIso &&
        task.due_date <= sevenDaysFromNow &&
        status !== 'approved' &&
        status !== 'cancelled'
      ) {
        upcomingDeadlines++;
      }
    }

    // Weekly completion trend (last 8 weeks)
    const weeklyTrend: { week: string; completed: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const label = `Wk ${8 - i}`;

      const completedInWeek = allTasks.filter(
        (t) =>
          t.status === 'approved' &&
          t.updated_at >= weekStart.toISOString() &&
          t.updated_at < weekEnd.toISOString()
      ).length;

      weeklyTrend.push({ week: label, completed: completedInWeek });
    }

    // Task Status Distribution Donut Data
    const taskStatusDistribution = [
      { name: 'In Progress', value: statusCounts.in_progress, color: '#38bdf8' },
      { name: 'Under Review', value: statusCounts.submitted_for_review, color: '#f59e0b' },
      { name: 'Revision', value: statusCounts.revision_required, color: '#fb923c' },
      { name: 'Approved', value: statusCounts.approved, color: '#10b981' },
      { name: 'Assigned', value: statusCounts.assigned, color: '#818cf8' },
      { name: 'Blocked', value: statusCounts.blocked, color: '#ef4444' },
    ];

    // Priority Distribution Bar Data
    const priorityDistribution = [
      { priority: 'Urgent', count: priorityCounts.urgent, color: '#ef4444' },
      { priority: 'High', count: priorityCounts.high, color: '#f97316' },
      { priority: 'Medium', count: priorityCounts.medium, color: '#eab308' },
      { priority: 'Low', count: priorityCounts.low, color: '#06b6d4' },
    ];

    // Department Workload Bar Data
    const departmentWorkload = Object.entries(deptWorkloadMap).map(([department, count]) => ({
      department,
      count,
    }));

    // Employee Workload Lifecycle Distribution
    const empMap = new Map<string, any>();
    for (const row of (empWorkloadRes?.rows || [])) {
      // If DEPARTMENT_HEAD, restrict to members in their departments + self
      if (userRole === 'DEPARTMENT_HEAD' && headDeptIds.length > 0) {
        if (row.employee_id !== user.id && !headDeptIds.includes(row.department_id)) {
          continue;
        }
      }
      // If regular EMPLOYEE, only show their own lifecycle
      if (userRole === 'EMPLOYEE' && row.employee_id !== user.id) {
        continue;
      }

      if (!empMap.has(row.employee_id)) {
        empMap.set(row.employee_id, {
          employee_id: row.employee_id,
          name: row.full_name || row.email,
          email: row.email,
          avatar_url: row.avatar_url,
          department_id: row.department_id,
          department: row.department_name,
          completed: 0,
          in_progress: 0,
          under_review: 0,
          revision_required: 0,
          assigned: 0,
          blocked: 0,
          overdue: 0,
          total: 0,
          active_tasks: 0,
          completion_rate: 0,
          load_status: 'available',
          tasks: [],
        });
      }

      if (row.task_id) {
        const emp = empMap.get(row.employee_id);
        emp.total++;
        const status = row.task_status;
        const isOverdue = Boolean(
          row.task_due_date &&
          row.task_due_date < todayIso &&
          status !== 'approved' &&
          status !== 'cancelled'
        );

        if (isOverdue) {
          emp.overdue++;
        }

        if (status === 'approved') {
          emp.completed++;
        } else if (status === 'in_progress') {
          emp.in_progress++;
        } else if (status === 'submitted_for_review') {
          emp.under_review++;
        } else if (status === 'revision_required') {
          emp.revision_required++;
        } else if (status === 'assigned' || status === 'pending') {
          emp.assigned++;
        } else if (status === 'blocked') {
          emp.blocked++;
        }

        // Keep task details for click-to-inspect drawer
        emp.tasks.push({
          id: row.task_id,
          title: row.task_title || 'Untitled Task',
          priority: row.task_priority || 'medium',
          status: status,
          due_date: row.task_due_date,
          is_overdue: isOverdue,
          project_id: row.task_project_id,
        });
      }
    }

    // Post-process capacity health and completion rate
    for (const emp of empMap.values()) {
      emp.active_tasks = emp.assigned + emp.in_progress + emp.under_review + emp.revision_required + emp.blocked;
      emp.completion_rate = emp.total > 0 ? Math.round((emp.completed / emp.total) * 100) : 0;
      if (emp.overdue > 0) {
        emp.load_status = 'overdue';
      } else if (emp.active_tasks >= 8) {
        emp.load_status = 'overloaded';
      } else if (emp.active_tasks >= 3) {
        emp.load_status = 'balanced';
      } else {
        emp.load_status = 'available';
      }
    }

    const employeeWorkload = Array.from(empMap.values());

    // Tasks Due Soon (Top 8 active tasks sorted by due_date ascending)
    const tasksDueSoon = allTasks
      .filter((t) => t.due_date && t.status !== 'approved' && t.status !== 'cancelled')
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 8)
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        due_date: t.due_date,
        department_name: t.department_id ? deptMap.get(t.department_id) || 'General' : 'General',
        assignee_name: assigneeMap.get(t.id) || 'Unassigned',
      }));

    // Recent activity feed formatted
    const recentActivities = (recentAuditLogs || []).map((l: any) => ({
      id: l.id,
      action: l.action,
      target_type: l.target_type,
      actor_name: l.actor?.full_name || 'System',
      created_at: l.created_at,
      details: l.details,
    }));

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
      },
      userRole,
      kpis: {
        totalEmployees: employeeCount || 0,
        totalDepartments: departmentCount || 0,
        activeProjects: projectCount || 0,
        tasksAwaitingReview,
        overdueTasks,
        inProgressTasks,
        approvedThisMonth,
        upcomingDeadlines,
      },
      charts: {
        taskStatusDistribution,
        departmentWorkload,
        weeklyCompletionTrend: weeklyTrend,
        priorityDistribution,
        employeeWorkload,
        taskLifecycle: {
          assigned: statusCounts.assigned,
          in_progress: statusCounts.in_progress,
          submitted_for_review: statusCounts.submitted_for_review,
          revision_required: statusCounts.revision_required,
          approved: statusCounts.approved,
          blocked: statusCounts.blocked,
          overdue: overdueTasks,
          total: allTasks.length,
          activeTotal: statusCounts.assigned + statusCounts.in_progress + statusCounts.submitted_for_review + statusCounts.revision_required + statusCounts.blocked,
          completionRate: allTasks.length > 0 ? Math.round((statusCounts.approved / allTasks.length) * 100) : 0,
        },
      },
      departments: (departments || []).map((d) => ({ id: d.id, name: d.name })),
      tables: {
        recentActivities,
        tasksDueSoon,
      },
    });
  } catch (error: any) {
    console.error('Company Dashboard API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
