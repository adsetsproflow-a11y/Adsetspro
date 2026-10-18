import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

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

    // 2. Fetch user profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, full_name, email, is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 401 });
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
    if (!profile.is_super_admin) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role, status')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

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
    }

    // 5. Gather raw metrics concurrently
    const [
      { count: employeeCount },
      { count: departmentCount },
      { count: projectCount },
      { data: departments },
      { data: tasks },
      { data: taskAssignments },
      { data: recentAuditLogs },
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

    // Tasks Due Soon (Top 5 active tasks sorted by due_date ascending)
    const tasksDueSoon = allTasks
      .filter((t) => t.due_date && t.status !== 'approved' && t.status !== 'cancelled')
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 5)
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
      },
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
