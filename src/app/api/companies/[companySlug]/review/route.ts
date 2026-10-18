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
    const departmentFilter = url.searchParams.get('department_id');

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

    // 3. Verify user membership and role (Only COMPANY_ADMIN and DEPARTMENT_HEAD)
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

    if (userRole !== 'COMPANY_ADMIN' && userRole !== 'DEPARTMENT_HEAD' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Review Queue is only accessible to Company Admins and Department Heads.' },
        { status: 403 }
      );
    }

    // 4. Query tasks in 'submitted_for_review' status
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
        created_at,
        updated_at
      `)
      .eq('company_id', company.id)
      .eq('status', 'submitted_for_review');

    // If department head, filter to tasks in their department or where they are designated reviewer
    if (userRole === 'DEPARTMENT_HEAD') {
      const { data: headDepts } = await adminClient
        .from('departments')
        .select('id')
        .eq('company_id', company.id)
        .eq('head_user_id', user.id);

      const deptIds = (headDepts || []).map((d) => d.id);
      if (deptIds.length > 0) {
        query = query.or(`department_id.in.(${deptIds.join(',')}),reviewer_id.eq.${user.id}`);
      } else {
        query = query.eq('reviewer_id', user.id);
      }
    } else if (departmentFilter && departmentFilter !== 'all') {
      query = query.eq('department_id', departmentFilter);
    }

    const { data: rawTasks, error: taskErr } = await query;

    if (taskErr) {
      throw taskErr;
    }

    const tasks = rawTasks || [];
    const taskIds = tasks.map((t) => t.id);

    // 5. Fetch current assignees for these tasks
    let taskAssigneeMap = new Map<string, { employee_id: string; full_name: string; avatar_url: string | null; email: string | null }>();
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
          .select('id, full_name, avatar_url, email')
          .in('id', empIds);

        const empMap = new Map<string, any>();
        (empProfiles || []).forEach((p) => empMap.set(p.id, p));

        (assignments || []).forEach((a) => {
          const emp = empMap.get(a.employee_id);
          if (emp) {
            taskAssigneeMap.set(a.task_id, {
              employee_id: a.employee_id,
              full_name: emp.full_name,
              avatar_url: emp.avatar_url,
              email: emp.email,
            });
          }
        });
      }
    }

    // 6. Fetch submission timestamp from task_activities
    let submissionDateMap = new Map<string, string>();
    if (taskIds.length > 0) {
      const { data: subActivities } = await adminClient
        .from('task_activities')
        .select('task_id, created_at, details')
        .in('task_id', taskIds)
        .eq('action', 'STATUS_CHANGED')
        .order('created_at', { ascending: false });

      (subActivities || []).forEach((act: any) => {
        if (act.details?.to_status === 'submitted_for_review' && !submissionDateMap.has(act.task_id)) {
          submissionDateMap.set(act.task_id, act.created_at);
        }
      });
    }

    // 7. Fetch department names and project names
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

    // 8. Fetch attachment count for each task
    let attachmentCountMap = new Map<string, number>();
    if (taskIds.length > 0) {
      const { data: attachments } = await adminClient
        .from('task_attachments')
        .select('task_id')
        .in('task_id', taskIds);

      (attachments || []).forEach((att) => {
        attachmentCountMap.set(att.task_id, (attachmentCountMap.get(att.task_id) || 0) + 1);
      });
    }

    const now = new Date();

    // 9. Format tasks and mark overdue
    let formattedTasks = tasks.map((t) => {
      const assignee = taskAssigneeMap.get(t.id);
      const submittedAt = submissionDateMap.get(t.id) || t.updated_at || t.created_at;
      const isOverdue = t.due_date ? new Date(t.due_date) < now : false;

      return {
        id: t.id,
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        start_date: t.start_date,
        due_date: t.due_date,
        submitted_at: submittedAt,
        is_overdue: isOverdue,
        department_id: t.department_id,
        department_name: (t.department_id && deptMap.get(t.department_id)) || 'General',
        project_id: t.project_id,
        project_name: (t.project_id && projMap.get(t.project_id)) || null,
        assignee_id: assignee?.employee_id || null,
        assignee_name: assignee?.full_name || 'Unassigned',
        assignee_avatar: assignee?.avatar_url || null,
        assignee_email: assignee?.email || null,
        attachment_count: attachmentCountMap.get(t.id) || 0,
      };
    });

    // 10. Sort by: OVERDUE FIRST, then by submitted_at (oldest submission first)
    formattedTasks.sort((a, b) => {
      if (a.is_overdue && !b.is_overdue) return -1;
      if (!a.is_overdue && b.is_overdue) return 1;

      // Oldest submission first to ensure fast review cycle
      const dateA = new Date(a.submitted_at).getTime();
      const dateB = new Date(b.submitted_at).getTime();
      return dateA - dateB;
    });

    // 11. Calculate Header Stats:
    // - Total awaiting review
    const totalAwaitingReview = formattedTasks.length;

    // - Overdue submissions (submitted but past due date)
    const overdueSubmissions = formattedTasks.filter((t) => t.is_overdue).length;

    // - Reviewed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { count: reviewedTodayCount } = await adminClient
      .from('task_activities')
      .select('id', { count: 'exact', head: true })
      .in('action', ['TASK_APPROVED', 'REVISION_REQUESTED'])
      .gte('created_at', startOfToday.toISOString());

    const reviewedToday = reviewedTodayCount || 0;

    // Fetch departments for filter
    const { data: allDepartments } = await adminClient
      .from('departments')
      .select('id, name')
      .eq('company_id', company.id)
      .order('name');

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      stats: {
        totalAwaitingReview,
        overdueSubmissions,
        reviewedToday,
      },
      departments: allDepartments || [],
      userRole,
    });
  } catch (error: any) {
    console.error('Fetch review queue error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
