import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

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

    // 2. Fetch company
    const { data: company, error: compErr } = await adminClient
      .from('companies')
      .select('id, name, slug')
      .eq('slug', companySlug)
      .single();

    if (compErr || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Verify user membership and role permissions
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    let userRole = 'EMPLOYEE';
    if (profile?.is_super_admin) {
      userRole = 'SUPER_ADMIN';
    } else {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden: No active membership' }, { status: 403 });
      }

      userRole = membership.role;
    }

    // Regular employees cannot view company-wide analytics
    if (userRole === 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Forbidden: Company analytics are restricted to Administrators and Department Heads.' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const departmentFilter = url.searchParams.get('departmentId');
    const dateRangeFilter = url.searchParams.get('dateRange') || '30d'; // 30d, 90d, all
    const statusFilter = url.searchParams.get('status');

    // 4. Fetch Total Employees & Departments
    const [employeesRes, departmentsRes] = await Promise.all([
      adminClient
        .from('company_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('status', 'active'),
      adminClient
        .from('departments')
        .select('id, name')
        .eq('company_id', company.id)
        .eq('status', 'active'),
    ]);

    const totalEmployees = employeesRes.count || 0;
    const departments = departmentsRes.data || [];
    const totalDepartments = departments.length;

    // 5. Build Tasks Query
    let tasksQuery = adminClient
      .from('tasks')
      .select(`
        id,
        title,
        status,
        priority,
        due_date,
        created_at,
        updated_at,
        department_id
      `)
      .eq('company_id', company.id);

    if (departmentFilter && departmentFilter !== 'all') {
      tasksQuery = tasksQuery.eq('department_id', departmentFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      tasksQuery = tasksQuery.eq('status', statusFilter as any);
    }

    const now = new Date();
    if (dateRangeFilter === '30d') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      tasksQuery = tasksQuery.gte('created_at', past30);
    } else if (dateRangeFilter === '90d') {
      const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      tasksQuery = tasksQuery.gte('created_at', past90);
    }

    const { data: tasks, error: tasksErr } = await tasksQuery;
    if (tasksErr) {
      throw tasksErr;
    }

    const allTasks = tasks || [];
    const nonCancelledTasks = allTasks.filter((t) => t.status !== 'cancelled');
    const approvedTasks = allTasks.filter((t) => t.status === 'approved');

    // Rule: Overdue = due_date < CURRENT_DATE AND status NOT IN (approved, cancelled)
    const overdueTasks = allTasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < now &&
        t.status !== 'approved' &&
        t.status !== 'cancelled'
    );

    // Rule: Completion rate = approved tasks / total non-cancelled tasks
    const completionRate =
      nonCancelledTasks.length > 0
        ? Math.round((approvedTasks.length / nonCancelledTasks.length) * 100)
        : 0;

    // a) Task Status Distribution (PieChart)
    const statusCounts: Record<string, number> = {
      assigned: 0,
      in_progress: 0,
      submitted: 0,
      revision_required: 0,
      approved: 0,
      cancelled: 0,
    };

    allTasks.forEach((t) => {
      const s = t.status === 'submitted_for_review' ? 'submitted' : t.status;
      if (statusCounts[s] !== undefined) {
        statusCounts[s]++;
      } else {
        statusCounts[s] = 1;
      }
    });

    const statusDistribution = [
      { name: 'Assigned', value: statusCounts.assigned, color: '#3b82f6' },
      { name: 'In Progress', value: statusCounts.in_progress, color: '#6366f1' },
      { name: 'Submitted', value: statusCounts.submitted, color: '#eab308' },
      { name: 'Revision', value: statusCounts.revision_required, color: '#f97316' },
      { name: 'Approved', value: statusCounts.approved, color: '#10b981' },
      { name: 'Cancelled', value: statusCounts.cancelled, color: '#6b7280' },
    ].filter((item) => item.value > 0);

    // b) Priority Distribution (PieChart)
    const priorityCounts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    allTasks.forEach((t) => {
      const p = (t.priority || 'medium').toLowerCase();
      if (priorityCounts[p] !== undefined) {
        priorityCounts[p]++;
      }
    });

    const priorityDistribution = [
      { name: 'Low', value: priorityCounts.low, color: '#94a3b8' },
      { name: 'Medium', value: priorityCounts.medium, color: '#38bdf8' },
      { name: 'High', value: priorityCounts.high, color: '#f59e0b' },
      { name: 'Urgent', value: priorityCounts.urgent, color: '#ef4444' },
    ];

    // c) Department Workload (Grouped BarChart)
    const deptMap = new Map<string, string>();
    departments.forEach((d) => deptMap.set(d.id, d.name));

    const deptWorkloadMap: Record<
      string,
      {
        department: string;
        inProgress: number;
        submitted: number;
        approved: number;
        overdue: number;
        total: number;
      }
    > = {};

    departments.forEach((d) => {
      deptWorkloadMap[d.id] = {
        department: d.name,
        inProgress: 0,
        submitted: 0,
        approved: 0,
        overdue: 0,
        total: 0,
      };
    });

    allTasks.forEach((t) => {
      if (t.department_id && deptWorkloadMap[t.department_id]) {
        const item = deptWorkloadMap[t.department_id];
        item.total++;
        if (t.status === 'in_progress') item.inProgress++;
        if (t.status === 'submitted_for_review') item.submitted++;
        if (t.status === 'approved') item.approved++;
        if (
          t.due_date &&
          new Date(t.due_date) < now &&
          t.status !== 'approved' &&
          t.status !== 'cancelled'
        ) {
          item.overdue++;
        }
      }
    });

    const departmentWorkload = Object.values(deptWorkloadMap);

    // d) Employee Workload (BarChart) - ONLY is_current=true
    const { data: assignments } = await adminClient
      .from('task_assignments')
      .select(`
        task_id,
        employee_id,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('is_current', true);

    const taskStatusMap = new Map<string, { status: string; due_date: string | null }>();
    allTasks.forEach((t) => taskStatusMap.set(t.id, { status: t.status, due_date: t.due_date }));

    const empWorkloadMap: Record<
      string,
      { name: string; activeTasks: number; approved: number; overdue: number }
    > = {};

    (assignments || []).forEach((a: any) => {
      const taskMeta = taskStatusMap.get(a.task_id);
      if (!taskMeta) return;

      const empName = a.profiles?.full_name || a.profiles?.email || 'Employee';
      if (!empWorkloadMap[a.employee_id]) {
        empWorkloadMap[a.employee_id] = {
          name: empName,
          activeTasks: 0,
          approved: 0,
          overdue: 0,
        };
      }

      const entry = empWorkloadMap[a.employee_id];
      if (taskMeta.status !== 'approved' && taskMeta.status !== 'cancelled') {
        entry.activeTasks++;
        if (taskMeta.due_date && new Date(taskMeta.due_date) < now) {
          entry.overdue++;
        }
      } else if (taskMeta.status === 'approved') {
        entry.approved++;
      }
    });

    const employeeWorkload = Object.values(empWorkloadMap)
      .sort((a, b) => b.activeTasks - a.activeTasks)
      .slice(0, 10);

    // e) Daily Completion Trend (LineChart - Last 30 Days)
    const dailyMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      dailyMap[dateKey] = 0;
    }

    allTasks.forEach((t) => {
      if (t.status === 'approved' && t.updated_at) {
        const dateKey = t.updated_at.split('T')[0];
        if (dailyMap[dateKey] !== undefined) {
          dailyMap[dateKey]++;
        }
      }
    });

    const dailyCompletionTrend = Object.entries(dailyMap).map(([date, approvedCount]) => {
      const parts = date.split('-');
      const label = `${parts[1]}/${parts[2]}`;
      return {
        date,
        label,
        approved: approvedCount,
      };
    });

    // f) Weekly Trend (BarChart - Last 12 Weeks: assigned vs approved)
    const weeklyMap: Record<string, { weekLabel: string; assigned: number; approved: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekKey = `W-${weekStart.toISOString().split('T')[0]}`;
      const label = `Wk ${12 - i}`;
      weeklyMap[weekKey] = { weekLabel: label, assigned: 0, approved: 0 };
    }

    const weekKeys = Object.keys(weeklyMap);
    allTasks.forEach((t) => {
      const createdDate = new Date(t.created_at);
      const updatedDate = new Date(t.updated_at);

      // Match created week
      const diffCreatedWeeks = Math.floor(
        (now.getTime() - createdDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      if (diffCreatedWeeks >= 0 && diffCreatedWeeks < 12) {
        const targetKey = weekKeys[11 - diffCreatedWeeks];
        if (targetKey && weeklyMap[targetKey]) {
          weeklyMap[targetKey].assigned++;
        }
      }

      // Match approved week
      if (t.status === 'approved') {
        const diffApprovedWeeks = Math.floor(
          (now.getTime() - updatedDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        if (diffApprovedWeeks >= 0 && diffApprovedWeeks < 12) {
          const targetKey = weekKeys[11 - diffApprovedWeeks];
          if (targetKey && weeklyMap[targetKey]) {
            weeklyMap[targetKey].approved++;
          }
        }
      }
    });

    const weeklyTrend = Object.values(weeklyMap);

    return NextResponse.json({
      success: true,
      summary: {
        totalEmployees,
        totalDepartments,
        totalTasks: allTasks.length,
        completionRate,
        overdueCount: overdueTasks.length,
        approvedCount: approvedTasks.length,
      },
      charts: {
        statusDistribution,
        priorityDistribution,
        departmentWorkload,
        employeeWorkload,
        dailyCompletionTrend,
        weeklyTrend,
      },
      departments,
    });
  } catch (err: any) {
    console.error('GET /api/companies/[slug]/analytics/company error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
