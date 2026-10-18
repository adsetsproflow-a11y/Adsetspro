import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; userId: string }> }
) {
  try {
    const { companySlug, userId } = await params;
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

    // 3. Role validation:
    // Employees can only see their own performance (server validates)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    let isAuthorized = false;
    if (user.id === userId || profile?.is_super_admin) {
      isAuthorized = true;
    } else {
      const { data: callerMembership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (callerMembership?.role === 'COMPANY_ADMIN') {
        isAuthorized = true;
      } else if (callerMembership?.role === 'DEPARTMENT_HEAD') {
        // Can view if target user is in their department
        const { data: callerDepts } = await adminClient
          .from('departments')
          .select('id')
          .eq('head_user_id', user.id);

        const deptIds = (callerDepts || []).map((d) => d.id);
        if (deptIds.length > 0) {
          const { data: targetMembership } = await adminClient
            .from('department_memberships')
            .select('id')
            .eq('user_id', userId)
            .in('department_id', deptIds)
            .maybeSingle();

          if (targetMembership) {
            isAuthorized = true;
          }
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: You are only permitted to view your own performance dashboard.' },
        { status: 403 }
      );
    }

    // 4. Fetch target user's profile
    const { data: targetProfile } = await adminClient
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('id', userId)
      .single();

    const now = new Date();

    // 5. Fetch all tasks assigned to this employee (is_current=true only)
    const { data: assignments, error: assignErr } = await adminClient
      .from('task_assignments')
      .select(`
        task_id,
        is_current,
        assigned_at,
        tasks (
          id,
          title,
          description,
          status,
          priority,
          start_date,
          due_date,
          created_at,
          updated_at,
          company_id,
          department_id,
          project_id,
          departments (name),
          projects (name)
        )
      `)
      .eq('employee_id', userId)
      .eq('is_current', true);

    if (assignErr) {
      throw assignErr;
    }

    const employeeTasks = (assignments || [])
      .map((a: any) => a.tasks)
      .filter(Boolean)
      .filter((t: any) => t.company_id === company.id);

    const nonCancelled = employeeTasks.filter((t: any) => t.status !== 'cancelled');
    const approved = employeeTasks.filter((t: any) => t.status === 'approved');
    const inProgress = employeeTasks.filter((t: any) => t.status === 'in_progress');
    const submitted = employeeTasks.filter((t: any) => t.status === 'submitted_for_review');
    const revision = employeeTasks.filter((t: any) => t.status === 'revision_required');
    const assigned = employeeTasks.filter((t: any) => t.status === 'assigned');

    // Rule: Overdue = due_date < CURRENT_DATE AND status NOT IN (approved, cancelled)
    const overdue = employeeTasks.filter(
      (t: any) =>
        t.due_date &&
        new Date(t.due_date) < now &&
        t.status !== 'approved' &&
        t.status !== 'cancelled'
    );

    const completionRate =
      nonCancelled.length > 0
        ? Math.round((approved.length / nonCancelled.length) * 100)
        : 0;

    // a) Monthly completion trend — LineChart (last 6 months approved tasks)
    const monthlyMap: Record<string, { month: string; approved: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('default', { month: 'short' });
      monthlyMap[key] = { month: monthName, approved: 0 };
    }

    approved.forEach((t: any) => {
      if (t.updated_at) {
        const key = t.updated_at.substring(0, 7);
        if (monthlyMap[key]) {
          monthlyMap[key].approved++;
        }
      }
    });

    const monthlyCompletionTrend = Object.values(monthlyMap);

    // b) Revision history — how many revision cycles per task
    const taskIds = employeeTasks.map((t: any) => t.id);
    let revisionsByTask: Record<string, number> = {};

    if (taskIds.length > 0) {
      const { data: activities } = await adminClient
        .from('task_activities')
        .select('task_id, action')
        .in('task_id', taskIds)
        .eq('action', 'REVISION_REQUESTED');

      (activities || []).forEach((r) => {
        revisionsByTask[r.task_id] = (revisionsByTask[r.task_id] || 0) + 1;
      });
    }

    // c) Task history table
    const taskHistory = employeeTasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      departmentName: t.departments?.name || 'General',
      projectName: t.projects?.name || 'Independent',
      due_date: t.due_date,
      start_date: t.start_date,
      created_at: t.created_at,
      revisionCycles: revisionsByTask[t.id] || (t.status === 'revision_required' ? 1 : 0),
      isOverdue: t.due_date ? new Date(t.due_date) < now && t.status !== 'approved' && t.status !== 'cancelled' : false,
    }));

    return NextResponse.json({
      success: true,
      employee: {
        id: targetProfile?.id || userId,
        name: targetProfile?.full_name || targetProfile?.email || 'Employee',
        email: targetProfile?.email,
        avatarUrl: targetProfile?.avatar_url,
      },
      summary: {
        assigned: assigned.length,
        inProgress: inProgress.length,
        submitted: submitted.length,
        revisionRequired: revision.length,
        approved: approved.length,
        overdue: overdue.length,
        totalTasks: employeeTasks.length,
        completionRate,
      },
      charts: {
        monthlyCompletionTrend,
      },
      taskHistory,
    });
  } catch (err: any) {
    console.error('GET /api/companies/[slug]/analytics/employee/[userId] error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
