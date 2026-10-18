import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; deptId: string }> }
) {
  try {
    const { companySlug, deptId } = await params;
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

    // 3. Verify department exists in this company
    const { data: department, error: deptErr } = await adminClient
      .from('departments')
      .select('id, name, description, head_user_id')
      .eq('id', deptId)
      .eq('company_id', company.id)
      .single();

    if (deptErr || !department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // 4. Role validation:
    // Department Heads can ONLY see their own department analytics (server validates)
    // Company Admin & Super Admin can view any department in the company
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    let isAuthorized = false;
    if (profile?.is_super_admin) {
      isAuthorized = true;
    } else {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership?.role === 'COMPANY_ADMIN') {
        isAuthorized = true;
      } else if (membership?.role === 'DEPARTMENT_HEAD') {
        // Must be head of this specific department
        if (department.head_user_id === user.id) {
          isAuthorized = true;
        } else {
          // Check department_memberships
          const { data: deptMembership } = await adminClient
            .from('department_memberships')
            .select('id')
            .eq('department_id', deptId)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();
          if (deptMembership) {
            isAuthorized = true;
          }
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: You are not authorized to view this department analytics.' },
        { status: 403 }
      );
    }

    const now = new Date();

    // 5. Fetch Department Tasks
    const { data: deptTasks } = await adminClient
      .from('tasks')
      .select(`
        id,
        title,
        status,
        priority,
        due_date,
        created_at,
        updated_at,
        reviewer_id
      `)
      .eq('department_id', deptId)
      .eq('company_id', company.id);

    const allTasks = deptTasks || [];
    const nonCancelledTasks = allTasks.filter((t) => t.status !== 'cancelled');
    const approvedTasks = allTasks.filter((t) => t.status === 'approved');

    // Overdue = due_date < CURRENT_DATE AND status NOT IN (approved, cancelled)
    const overdueTasks = allTasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < now &&
        t.status !== 'approved' &&
        t.status !== 'cancelled'
    );

    const completionRate =
      nonCancelledTasks.length > 0
        ? Math.round((approvedTasks.length / nonCancelledTasks.length) * 100)
        : 0;

    // 6. Fetch department members and assignments (ONLY is_current=true)
    const taskIds = allTasks.map((t) => t.id);
    let assignments: any[] = [];
    if (taskIds.length > 0) {
      const { data: assignData } = await adminClient
        .from('task_assignments')
        .select(`
          task_id,
          employee_id,
          profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .in('task_id', taskIds)
        .eq('is_current', true);
      assignments = assignData || [];
    }

    const taskAssigneeMap = new Map<string, { id: string; name: string }>();
    const employeeMap = new Map<string, string>();

    assignments.forEach((a) => {
      const name = a.profiles?.full_name || a.profiles?.email || 'Employee';
      taskAssigneeMap.set(a.task_id, { id: a.employee_id, name });
      employeeMap.set(a.employee_id, name);
    });

    // a) Employee Task Status Breakdown (Grouped BarChart per employee)
    const empStatusMap: Record<
      string,
      {
        name: string;
        assigned: number;
        inProgress: number;
        submitted: number;
        approved: number;
        overdue: number;
      }
    > = {};

    employeeMap.forEach((name, empId) => {
      empStatusMap[empId] = {
        name,
        assigned: 0,
        inProgress: 0,
        submitted: 0,
        approved: 0,
        overdue: 0,
      };
    });

    allTasks.forEach((t) => {
      const assignee = taskAssigneeMap.get(t.id);
      if (assignee && empStatusMap[assignee.id]) {
        const item = empStatusMap[assignee.id];
        if (t.status === 'assigned') item.assigned++;
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

    const employeeStatusBreakdown = Object.values(empStatusMap);

    // b) Completion Trend (LineChart - Last 12 Weeks approved count)
    const weeklyMap: Record<string, { weekLabel: string; approved: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekKey = `W-${weekStart.toISOString().split('T')[0]}`;
      const label = `Wk ${12 - i}`;
      weeklyMap[weekKey] = { weekLabel: label, approved: 0 };
    }

    const weekKeys = Object.keys(weeklyMap);
    allTasks.forEach((t) => {
      if (t.status === 'approved' && t.updated_at) {
        const updatedDate = new Date(t.updated_at);
        const diffWeeks = Math.floor(
          (now.getTime() - updatedDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        if (diffWeeks >= 0 && diffWeeks < 12) {
          const targetKey = weekKeys[11 - diffWeeks];
          if (targetKey && weeklyMap[targetKey]) {
            weeklyMap[targetKey].approved++;
          }
        }
      }
    });

    const completionTrend = Object.values(weeklyMap);

    // c) Overdue by Employee (HorizontalBarChart)
    const overdueByEmployee = employeeStatusBreakdown
      .filter((e) => e.overdue > 0)
      .map((e) => ({ name: e.name, overdue: e.overdue }));

    // d) Review Queue (Table with due dates)
    const reviewQueue = allTasks
      .filter((t) => t.status === 'submitted_for_review')
      .map((t) => {
        const assignee = taskAssigneeMap.get(t.id);
        const isOverdue = t.due_date ? new Date(t.due_date) < now : false;
        return {
          id: t.id,
          title: t.title,
          priority: t.priority,
          due_date: t.due_date,
          isOverdue,
          assigneeName: assignee?.name || 'Unassigned',
        };
      })
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return 0;
      });

    return NextResponse.json({
      success: true,
      department: {
        id: department.id,
        name: department.name,
        description: department.description,
      },
      summary: {
        totalEmployees: employeeMap.size,
        totalTasks: allTasks.length,
        completionRate,
        overdueCount: overdueTasks.length,
        awaitingReviewCount: reviewQueue.length,
        approvedCount: approvedTasks.length,
      },
      charts: {
        employeeStatusBreakdown,
        completionTrend,
        overdueByEmployee,
      },
      reviewQueue,
    });
  } catch (err: any) {
    console.error('GET /api/companies/[slug]/analytics/department/[deptId] error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
