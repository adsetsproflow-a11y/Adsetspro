import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
    let user: any = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {}

    if (!user) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('saaa_session')?.value;
      if (sessionCookie) {
        try {
          const raw = sessionCookie.includes('%') ? decodeURIComponent(sessionCookie) : sessionCookie;
          const decoded = Buffer.from(raw, 'base64').toString('utf8');
          const parsed = JSON.parse(decoded);
          if (parsed?.id) user = parsed;
        } catch {}
      }
    }

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

    // If department head, filter to tasks in their department, or where they created the task, or where they are designated reviewer
    if (userRole === 'DEPARTMENT_HEAD') {
      const { data: headDepts } = await adminClient
        .from('departments')
        .select('id')
        .eq('company_id', company.id)
        .eq('head_user_id', user.id);

      const deptIds = (headDepts || []).map((d) => d.id);
      if (deptIds.length > 0) {
        query = query.or(`department_id.in.(${deptIds.join(',')}),reviewer_id.eq.${user.id},created_by.eq.${user.id}`);
      } else {
        query = query.or(`reviewer_id.eq.${user.id},created_by.eq.${user.id}`);
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
    const deptIds = Array.from(new Set(tasks.map((t) => t.department_id).filter(Boolean))) as string[];
    const projIds = Array.from(new Set(tasks.map((t) => t.project_id).filter(Boolean))) as string[];

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 5. Parallel Batch Queries for Maximum Concurrency Throughput
    const [
      assignmentsRes,
      subActivitiesRes,
      deptsRes,
      projsRes,
      attachmentsRes,
      reviewedTodayRes,
      allDepartmentsRes,
    ] = await Promise.all([
      taskIds.length > 0
        ? adminClient.from('task_assignments').select('task_id, employee_id').in('task_id', taskIds).eq('is_current', true)
        : Promise.resolve({ data: [] }),
      taskIds.length > 0
        ? adminClient.from('task_activities').select('task_id, created_at, details').in('task_id', taskIds).eq('action', 'STATUS_CHANGED').order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      deptIds.length > 0
        ? adminClient.from('departments').select('id, name').in('id', deptIds)
        : Promise.resolve({ data: [] }),
      projIds.length > 0
        ? adminClient.from('projects').select('id, name').in('id', projIds)
        : Promise.resolve({ data: [] }),
      taskIds.length > 0
        ? adminClient.from('task_attachments').select('task_id').in('task_id', taskIds)
        : Promise.resolve({ data: [] }),
      adminClient.from('task_activities').select('id', { count: 'exact', head: true }).in('action', ['TASK_APPROVED', 'REVISION_REQUESTED']).gte('created_at', startOfToday.toISOString()),
      adminClient.from('departments').select('id, name').eq('company_id', company.id).order('name'),
    ]);

    const assignments = assignmentsRes.data || [];
    const empIds = Array.from(new Set(assignments.map((a: any) => a.employee_id)));

    // Fetch assignee profiles
    let taskAssigneeMap = new Map<string, { employee_id: string; full_name: string; avatar_url: string | null; email: string | null }>();
    if (empIds.length > 0) {
      const { data: empProfiles } = await adminClient
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', empIds);

      const empMap = new Map<string, any>();
      (empProfiles || []).forEach((p: any) => empMap.set(p.id, p));

      assignments.forEach((a: any) => {
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

    // Process submission timestamps
    let submissionDateMap = new Map<string, string>();
    (subActivitiesRes.data || []).forEach((act: any) => {
      if (act.details?.to_status === 'submitted_for_review' && !submissionDateMap.has(act.task_id)) {
        submissionDateMap.set(act.task_id, act.created_at);
      }
    });

    // Maps for departments and projects
    let deptMap = new Map<string, string>();
    (deptsRes.data || []).forEach((d: any) => deptMap.set(d.id, d.name));

    let projMap = new Map<string, string>();
    (projsRes.data || []).forEach((p: any) => projMap.set(p.id, p.name));

    // Attachment counts
    let attachmentCountMap = new Map<string, number>();
    (attachmentsRes.data || []).forEach((att: any) => {
      attachmentCountMap.set(att.task_id, (attachmentCountMap.get(att.task_id) || 0) + 1);
    });

    const now = new Date();

    // Format tasks and mark overdue
    let formattedTasks = tasks.map((t: any) => {
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

    // Sort by: OVERDUE FIRST, then by submitted_at
    formattedTasks.sort((a, b) => {
      if (a.is_overdue && !b.is_overdue) return -1;
      if (!a.is_overdue && b.is_overdue) return 1;
      const dateA = new Date(a.submitted_at).getTime();
      const dateB = new Date(b.submitted_at).getTime();
      return dateA - dateB;
    });

    const totalAwaitingReview = formattedTasks.length;
    const overdueSubmissions = formattedTasks.filter((t) => t.is_overdue).length;
    const reviewedToday = reviewedTodayRes.count || 0;

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      stats: {
        totalAwaitingReview,
        overdueSubmissions,
        reviewedToday,
      },
      departments: allDepartmentsRes.data || [],
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
