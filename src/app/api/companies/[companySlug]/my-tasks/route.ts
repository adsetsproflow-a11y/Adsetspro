import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const url = new URL(request.url);

    // Query filters
    const statusFilter = url.searchParams.get('status');
    const priorityFilter = url.searchParams.get('priority');
    const projectFilter = url.searchParams.get('project_id');
    const searchQuery = url.searchParams.get('search');
    const startDateFilter = url.searchParams.get('startDate');
    const endDateFilter = url.searchParams.get('endDate');

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

    // 3. Verify user is active member of company
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
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

      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden: Active membership required' },
          { status: 403 }
        );
      }
    }

    // 4. CRITICAL SECURITY FILTER: Fetch current user's active assignments ONLY
    // Filter: task_assignments WHERE employee_id = auth.uid() AND is_current = true
    // NEVER return other employees' tasks!
    const { data: myAssignments, error: assignErr } = await adminClient
      .from('task_assignments')
      .select('task_id, assigned_at')
      .eq('employee_id', user.id)
      .eq('is_current', true);

    if (assignErr) {
      throw assignErr;
    }

    const myTaskIds = (myAssignments || []).map((a) => a.task_id);

    if (myTaskIds.length === 0) {
      return NextResponse.json({
        success: true,
        tasks: [],
        summary: {
          totalAssigned: 0,
          inProgress: 0,
          overdue: 0,
          submittedForReview: 0,
          revisionRequired: 0,
          approvedThisMonth: 0,
        },
        projects: [],
      });
    }

    // 5. Query tasks matching user's task IDs within this company
    let query = adminClient
      .from('tasks')
      .select(`
        id,
        company_id,
        department_id,
        project_id,
        title,
        description,
        status,
        priority,
        start_date,
        due_date,
        reviewer_id,
        created_by,
        created_at,
        updated_at
      `)
      .in('id', myTaskIds)
      .eq('company_id', company.id);

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter as any);
    }

    if (priorityFilter && priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter as any);
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

    query = query.order('due_date', { ascending: true, nullsFirst: false });

    const { data: rawTasks, error: taskErr } = await query;

    if (taskErr) {
      throw taskErr;
    }

    const tasks = rawTasks || [];

    // 6. Fetch related projects, departments, and reviewer profiles
    const projectIds = Array.from(new Set(tasks.map((t) => t.project_id).filter(Boolean))) as string[];
    const departmentIds = Array.from(new Set(tasks.map((t) => t.department_id).filter(Boolean))) as string[];
    const reviewerIds = Array.from(new Set(tasks.map((t) => t.reviewer_id).filter(Boolean))) as string[];

    let projectMap = new Map<string, { id: string; name: string }>();
    if (projectIds.length > 0) {
      const { data: projs } = await adminClient
        .from('projects')
        .select('id, name')
        .in('id', projectIds);
      (projs || []).forEach((p) => projectMap.set(p.id, p));
    }

    let departmentMap = new Map<string, { id: string; name: string }>();
    if (departmentIds.length > 0) {
      const { data: depts } = await adminClient
        .from('departments')
        .select('id, name')
        .in('id', departmentIds);
      (depts || []).forEach((d) => departmentMap.set(d.id, d));
    }

    let reviewerMap = new Map<string, { id: string; full_name: string; email: string; avatar_url: string | null }>();
    if (reviewerIds.length > 0) {
      const { data: revs } = await adminClient
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', reviewerIds);
      (revs || []).forEach((r) => reviewerMap.set(r.id, r));
    }

    // 7. Calculate all 6 Summary Card metrics from ALL current user's tasks
    // Fetch all user's tasks without filters for summary cards
    const { data: allUserTasks } = await adminClient
      .from('tasks')
      .select('id, status, due_date, updated_at')
      .in('id', myTaskIds)
      .eq('company_id', company.id);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalAssigned = 0;
    let inProgress = 0;
    let overdue = 0;
    let submittedForReview = 0;
    let revisionRequired = 0;
    let approvedThisMonth = 0;

    (allUserTasks || []).forEach((t) => {
      totalAssigned++;

      if (t.status === 'in_progress') inProgress++;
      if (t.status === 'submitted_for_review') submittedForReview++;
      if (t.status === 'revision_required') revisionRequired++;

      // Check overdue: due_date < now AND not approved/cancelled
      if (t.due_date && new Date(t.due_date) < now && t.status !== 'approved' && t.status !== 'cancelled') {
        overdue++;
      }

      // Check approved this month
      if (t.status === 'approved' && t.updated_at) {
        const updated = new Date(t.updated_at);
        if (updated.getMonth() === currentMonth && updated.getFullYear() === currentYear) {
          approvedThisMonth++;
        }
      }
    });

    // 8. Format returned tasks
    const formattedTasks = tasks.map((t) => {
      const proj = t.project_id ? projectMap.get(t.project_id) : null;
      const dept = t.department_id ? departmentMap.get(t.department_id) : null;
      const rev = t.reviewer_id ? reviewerMap.get(t.reviewer_id) : null;
      const isOverdue =
        t.due_date && new Date(t.due_date) < now && t.status !== 'approved' && t.status !== 'cancelled';

      return {
        id: t.id,
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        start_date: t.start_date,
        due_date: t.due_date,
        is_overdue: Boolean(isOverdue),
        created_at: t.created_at,
        updated_at: t.updated_at,
        project_id: t.project_id,
        project_name: proj?.name || null,
        department_id: t.department_id,
        department_name: dept?.name || 'General',
        reviewer_id: t.reviewer_id,
        reviewer_name: rev?.full_name || 'Department Reviewer',
        reviewer_email: rev?.email || null,
        reviewer_avatar: rev?.avatar_url || null,
      };
    });

    // Fetch list of distinct company projects for filter dropdown
    const { data: companyProjects } = await adminClient
      .from('projects')
      .select('id, name')
      .eq('company_id', company.id)
      .order('name');

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      summary: {
        totalAssigned,
        inProgress,
        overdue,
        submittedForReview,
        revisionRequired,
        approvedThisMonth,
      },
      projects: companyProjects || [],
    });
  } catch (error: any) {
    console.error('Fetch my-tasks error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
