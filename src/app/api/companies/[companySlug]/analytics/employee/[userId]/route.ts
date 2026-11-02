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

    // 5. Fetch all active task assignments for this employee
    const { data: assignments, error: assignErr } = await adminClient
      .from('task_assignments')
      .select('task_id, assigned_at')
      .eq('employee_id', userId)
      .eq('is_current', true);

    if (assignErr) {
      throw assignErr;
    }

    const taskIds = Array.from(new Set((assignments || []).map((a: any) => a.task_id).filter(Boolean))) as string[];

    // Monthly baseline map for last 6 months
    const monthlyMap: Record<string, { month: string; approved: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('default', { month: 'short' });
      monthlyMap[key] = { month: monthName, approved: 0 };
    }

    if (taskIds.length === 0) {
      return NextResponse.json({
        success: true,
        employee: {
          id: targetProfile?.id || userId,
          name: targetProfile?.full_name || targetProfile?.email || 'Employee',
          email: targetProfile?.email,
          avatarUrl: targetProfile?.avatar_url,
        },
        summary: {
          assigned: 0,
          inProgress: 0,
          submitted: 0,
          revisionRequired: 0,
          approved: 0,
          overdue: 0,
          totalTasks: 0,
          completionRate: 0,
          onTimeRate: 100,
          firstTimeApprovalRate: 100,
          avgTurnaroundDays: 0,
          qualityScore: 100,
          qualityTier: 'Good Standing',
        },
        charts: {
          monthlyCompletionTrend: Object.values(monthlyMap),
          priorityCounts: { urgent: 0, high: 0, medium: 0, low: 0 },
        },
        badges: [
          {
            id: 'dead_on_time',
            title: 'Dead-on-Time Delivery',
            description: 'Maintain 90%+ on-time completion record',
            icon: 'Target',
            unlocked: false,
            progress: '0% on-time',
          },
          {
            id: 'first_time_right',
            title: 'First-Time Right',
            description: 'Deliver tasks approved on initial submission without rework',
            icon: 'CheckCircle2',
            unlocked: false,
            progress: '0 approved cleanly',
          },
          {
            id: 'speed_demon',
            title: 'High Velocity',
            description: 'Average deliverable turnaround time under 3 days',
            icon: 'Zap',
            unlocked: false,
            progress: 'No completed tasks yet',
          },
          {
            id: 'master_contributor',
            title: 'Master Contributor',
            description: 'Complete 3+ enterprise deliverables',
            icon: 'Award',
            unlocked: false,
            progress: '0 / 3 completed',
          },
        ],
        taskHistory: [],
      });
    }

    // 6. Fetch task records
    const { data: rawTasks, error: taskErr } = await adminClient
      .from('tasks')
      .select('id, title, description, task_url, status, priority, start_date, due_date, created_at, updated_at, company_id, department_id, project_id')
      .in('id', taskIds)
      .eq('company_id', company.id);

    if (taskErr) {
      throw taskErr;
    }

    const employeeTasks = rawTasks || [];

    // 7. Parallel fetch related departments, projects, and activities
    const deptIds = Array.from(new Set(employeeTasks.map((t: any) => t.department_id).filter(Boolean))) as string[];
    const projIds = Array.from(new Set(employeeTasks.map((t: any) => t.project_id).filter(Boolean))) as string[];

    const [deptsRes, projsRes, activitiesRes] = await Promise.all([
      deptIds.length > 0
        ? adminClient.from('departments').select('id, name').in('id', deptIds)
        : Promise.resolve({ data: [] }),
      projIds.length > 0
        ? adminClient.from('projects').select('id, name').in('id', projIds)
        : Promise.resolve({ data: [] }),
      adminClient
        .from('task_activities')
        .select('task_id, action, created_at')
        .in('task_id', taskIds)
        .eq('action', 'REVISION_REQUESTED'),
    ]);

    const deptMap = new Map((deptsRes.data || []).map((d: any) => [d.id, d.name]));
    const projMap = new Map((projsRes.data || []).map((p: any) => [p.id, p.name]));

    let revisionsByTask: Record<string, number> = {};
    (activitiesRes.data || []).forEach((r: any) => {
      revisionsByTask[r.task_id] = (revisionsByTask[r.task_id] || 0) + 1;
    });

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

    // Advanced Metrics:
    // 1. On-Time Delivery Rate
    const onTimeApproved = approved.filter((t: any) => {
      if (!t.due_date) return true;
      const completedTime = t.updated_at ? new Date(t.updated_at).getTime() : now.getTime();
      const dueTime = new Date(t.due_date).getTime() + 86400000;
      return completedTime <= dueTime;
    });
    const onTimeRate = approved.length > 0
      ? Math.round((onTimeApproved.length / approved.length) * 100)
      : 100;

    // 2. First-Time Approval Rate
    const firstTimeApproved = approved.filter((t: any) => (revisionsByTask[t.id] || 0) === 0);
    const firstTimeApprovalRate = approved.length > 0
      ? Math.round((firstTimeApproved.length / approved.length) * 100)
      : 100;

    // 3. Average Turnaround Days
    let totalTurnaroundMs = 0;
    let turnaroundCount = 0;
    approved.forEach((t: any) => {
      if (t.created_at && t.updated_at) {
        const diff = new Date(t.updated_at).getTime() - new Date(t.created_at).getTime();
        if (diff > 0) {
          totalTurnaroundMs += diff;
          turnaroundCount++;
        }
      }
    });
    const avgTurnaroundDays = turnaroundCount > 0
      ? Number((totalTurnaroundMs / (turnaroundCount * 86400000)).toFixed(1))
      : 0;

    // 4. Quality Score & Tier
    const qualityScore = approved.length > 0
      ? Math.min(100, Math.round(onTimeRate * 0.4 + firstTimeApprovalRate * 0.4 + completionRate * 0.2))
      : 85;

    let qualityTier = 'Good Standing';
    if (qualityScore >= 90) qualityTier = 'Exceptional';
    else if (qualityScore >= 75) qualityTier = 'High Performer';

    // 5. Monthly completion trend
    approved.forEach((t: any) => {
      if (t.updated_at) {
        try {
          const d = new Date(t.updated_at);
          if (!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyMap[key]) {
              monthlyMap[key].approved++;
            }
          }
        } catch {}
      }
    });

    // 6. Priority distribution
    const priorityCounts = {
      urgent: employeeTasks.filter((t: any) => t.priority === 'urgent').length,
      high: employeeTasks.filter((t: any) => t.priority === 'high').length,
      medium: employeeTasks.filter((t: any) => t.priority === 'medium').length,
      low: employeeTasks.filter((t: any) => t.priority === 'low').length,
    };

    // 7. Gamification Badges
    const badges = [
      {
        id: 'dead_on_time',
        title: 'Dead-on-Time Delivery',
        description: 'Maintain 90%+ on-time completion record',
        icon: 'Target',
        unlocked: onTimeRate >= 90 && approved.length >= 1,
        progress: `${onTimeRate}% on-time`,
      },
      {
        id: 'first_time_right',
        title: 'First-Time Right',
        description: 'Deliver tasks approved on initial submission without rework',
        icon: 'CheckCircle2',
        unlocked: firstTimeApproved.length >= 1,
        progress: `${firstTimeApproved.length} approved cleanly`,
      },
      {
        id: 'speed_demon',
        title: 'High Velocity',
        description: 'Average deliverable turnaround time under 3 days',
        icon: 'Zap',
        unlocked: avgTurnaroundDays > 0 && avgTurnaroundDays <= 3 && approved.length >= 1,
        progress: avgTurnaroundDays > 0 ? `${avgTurnaroundDays} days avg` : 'Pending',
      },
      {
        id: 'master_contributor',
        title: 'Master Contributor',
        description: 'Complete 3+ enterprise deliverables',
        icon: 'Award',
        unlocked: approved.length >= 3,
        progress: `${approved.length} / 3 completed`,
      },
    ];

    // 8. Task history table
    const taskHistory = employeeTasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      task_url: t.task_url || null,
      departmentName: (t.department_id && deptMap.get(t.department_id)) || 'General',
      projectName: (t.project_id && projMap.get(t.project_id)) || 'Independent',
      due_date: t.due_date ? new Date(t.due_date).toISOString() : null,
      start_date: t.start_date ? new Date(t.start_date).toISOString() : null,
      created_at: t.created_at ? new Date(t.created_at).toISOString() : new Date().toISOString(),
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
        onTimeRate,
        firstTimeApprovalRate,
        avgTurnaroundDays,
        qualityScore,
        qualityTier,
      },
      charts: {
        monthlyCompletionTrend: Object.values(monthlyMap),
        priorityCounts,
      },
      badges,
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
