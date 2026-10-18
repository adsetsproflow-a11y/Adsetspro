import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/utils/dateFormat';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const { searchParams } = new URL(request.url);

    // Filters for tasks
    const filterDept = searchParams.get('department') || '';
    const filterEmployee = searchParams.get('employee') || '';
    const filterStatus = searchParams.get('status') || '';
    const filterPriority = searchParams.get('priority') || '';
    const filterStartDate = searchParams.get('startDate') || '';
    const filterEndDate = searchParams.get('endDate') || '';

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
      return NextResponse.json({ error: 'Company workspace not found' }, { status: 404 });
    }

    // 3. Verify user membership (COMPANY_ADMIN, DEPARTMENT_HEAD, or EMPLOYEE)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    let userRole = 'EMPLOYEE';
    if (!profile?.is_super_admin) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
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
      userRole = 'COMPANY_ADMIN';
    }

    // 4. Fetch all company departments and designations for mapping
    const [{ data: departments }, { data: designations }] = await Promise.all([
      adminClient.from('departments').select('id, name, head_user_id').eq('company_id', company.id),
      adminClient.from('designations').select('id, name').eq('company_id', company.id),
    ]);

    const deptMap = new Map<string, string>();
    const deptHeadMap = new Map<string, string | null>();
    (departments || []).forEach((d) => {
      deptMap.set(d.id, d.name);
      deptHeadMap.set(d.id, d.head_user_id);
    });

    const desigMap = new Map<string, string>();
    (designations || []).forEach((dg) => desigMap.set(dg.id, dg.name));

    // 5. Fetch all company members and profile info
    const { data: companyMembers } = await adminClient
      .from('company_memberships')
      .select('user_id, role')
      .eq('company_id', company.id)
      .eq('status', 'active');

    const memberIds = (companyMembers || []).map((m) => m.user_id);

    // Fetch department memberships to link user with department and designation
    const { data: deptMemberships } = await adminClient
      .from('department_memberships')
      .select('user_id, department_id, designation_id')
      .eq('status', 'active');

    const userDeptMap = new Map<string, string>();
    const userDesigMap = new Map<string, string>();
    (deptMemberships || []).forEach((dm) => {
      if (dm.department_id && deptMap.has(dm.department_id)) {
        userDeptMap.set(dm.user_id, dm.department_id);
      }
      if (dm.designation_id) {
        userDesigMap.set(dm.user_id, dm.designation_id);
      }
    });

    let memberProfiles: any[] = [];
    if (memberIds.length > 0) {
      const { data: profs } = await adminClient
        .from('profiles')
        .select('id, full_name, email')
        .in('id', memberIds);
      memberProfiles = profs || [];
    }

    const profileMap = new Map<string, { full_name: string; email: string | null }>();
    memberProfiles.forEach((p) => profileMap.set(p.id, { full_name: p.full_name, email: p.email }));

    // 6. Fetch current task assignments for assignee lookup
    const { data: assignments } = await adminClient
      .from('task_assignments')
      .select('task_id, employee_id')
      .eq('is_current', true);

    const taskAssigneeMap = new Map<string, string>();
    (assignments || []).forEach((a) => taskAssigneeMap.set(a.task_id, a.employee_id));

    // 7. TASK REPORT QUERY
    let taskQuery = adminClient
      .from('tasks')
      .select('id, title, description, status, priority, due_date, department_id, created_at, updated_at')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (filterDept) {
      taskQuery = taskQuery.eq('department_id', filterDept);
    }
    if (filterStatus) {
      taskQuery = taskQuery.eq('status', filterStatus as any);
    }
    if (filterPriority) {
      taskQuery = taskQuery.eq('priority', filterPriority as any);
    }
    if (filterStartDate) {
      taskQuery = taskQuery.gte('created_at', `${filterStartDate}T00:00:00Z`);
    }
    if (filterEndDate) {
      taskQuery = taskQuery.lte('created_at', `${filterEndDate}T23:59:59Z`);
    }

    const { data: rawTasks } = await taskQuery;

    // Filter by employee in memory if employee filter provided
    let filteredTasks = rawTasks || [];
    if (filterEmployee) {
      filteredTasks = filteredTasks.filter((t) => taskAssigneeMap.get(t.id) === filterEmployee);
    }

    const taskReport = filteredTasks.map((t) => {
      const assigneeId = taskAssigneeMap.get(t.id);
      const assigneeProf = assigneeId ? profileMap.get(assigneeId) : null;
      const deptName = t.department_id ? deptMap.get(t.department_id) || 'General' : 'General';
      const isApproved = t.status === 'approved';

      return {
        id: t.id,
        title: t.title,
        assignee: assigneeProf ? assigneeProf.full_name : 'Unassigned',
        assigneeId: assigneeId || null,
        department: deptName,
        departmentId: t.department_id || null,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date ? formatDate(t.due_date, 'short') : 'None',
        rawDueDate: t.due_date,
        completionDate: isApproved ? formatDate(t.updated_at, 'short') : 'Pending',
        rawCompletionDate: isApproved ? t.updated_at : null,
      };
    });

    // 8. EMPLOYEE REPORT QUERY
    // Gather task metrics per employee across all company tasks
    const { data: allCompanyTasks } = await adminClient
      .from('tasks')
      .select('id, status, due_date, department_id')
      .eq('company_id', company.id);

    const now = new Date();

    const empTaskStats = new Map<
      string,
      { active: number; completed: number; overdue: number }
    >();

    memberIds.forEach((id) => {
      empTaskStats.set(id, { active: 0, completed: 0, overdue: 0 });
    });

    (allCompanyTasks || []).forEach((t) => {
      const assigneeId = taskAssigneeMap.get(t.id);
      if (assigneeId && empTaskStats.has(assigneeId)) {
        const stats = empTaskStats.get(assigneeId)!;
        if (['assigned', 'in_progress', 'submitted_for_review', 'revision_required'].includes(t.status)) {
          stats.active += 1;
        }
        if (t.status === 'approved') {
          stats.completed += 1;
        }
        if (t.due_date && new Date(t.due_date) < now && t.status !== 'approved' && t.status !== 'cancelled') {
          stats.overdue += 1;
        }
      }
    });

    const employeeReport = (companyMembers || []).map((m) => {
      const prof = profileMap.get(m.user_id);
      const stats = empTaskStats.get(m.user_id) || { active: 0, completed: 0, overdue: 0 };
      const userDeptId = userDeptMap.get(m.user_id);
      const userDesigId = userDesigMap.get(m.user_id);
      const dName = userDeptId ? deptMap.get(userDeptId) || 'General' : 'General';
      const desName = userDesigId ? desigMap.get(userDesigId) || 'Member' : 'Member';

      return {
        id: m.user_id,
        name: prof?.full_name || 'Team Member',
        email: prof?.email || null,
        department: dName,
        designation: desName,
        role: m.role,
        activeTasks: stats.active,
        completedTasks: stats.completed,
        overdueTasks: stats.overdue,
      };
    });

    // 9. DEPARTMENT REPORT QUERY
    // Map heads
    const allHeadIds = Array.from(new Set(Array.from(deptHeadMap.values()).filter(Boolean))) as string[];
    let headProfiles: any[] = [];
    if (allHeadIds.length > 0) {
      const { data: hProfs } = await adminClient
        .from('profiles')
        .select('id, full_name')
        .in('id', allHeadIds);
      headProfiles = hProfs || [];
    }
    const headMap = new Map<string, string>();
    headProfiles.forEach((h) => headMap.set(h.id, h.full_name));

    // Count members per dept
    const deptMemberCount: Record<string, number> = {};
    (deptMemberships || []).forEach((dm) => {
      if (dm.department_id && deptMap.has(dm.department_id)) {
        deptMemberCount[dm.department_id] = (deptMemberCount[dm.department_id] || 0) + 1;
      }
    });

    // Count tasks per dept
    const deptTaskStats: Record<string, { total: number; completed: number; overdue: number }> = {};
    (departments || []).forEach((d) => {
      deptTaskStats[d.id] = { total: 0, completed: 0, overdue: 0 };
    });

    (allCompanyTasks || []).forEach((t) => {
      if (t.department_id && deptTaskStats[t.department_id]) {
        const stats = deptTaskStats[t.department_id];
        stats.total += 1;
        if (t.status === 'approved') stats.completed += 1;
        if (t.due_date && new Date(t.due_date) < now && t.status !== 'approved' && t.status !== 'cancelled') {
          stats.overdue += 1;
        }
      }
    });

    const departmentReport = (departments || []).map((d) => {
      const stats = deptTaskStats[d.id] || { total: 0, completed: 0, overdue: 0 };
      const headName = d.head_user_id ? headMap.get(d.head_user_id) || 'Unassigned' : 'Unassigned';
      const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      return {
        id: d.id,
        department: d.name,
        head: headName,
        employeeCount: deptMemberCount[d.id] || 0,
        totalTasks: stats.total,
        completionRate: `${completionRate}%`,
        overdueCount: stats.overdue,
      };
    });

    return NextResponse.json({
      success: true,
      filters: {
        departments: (departments || []).map((d) => ({ id: d.id, name: d.name })),
        employees: (companyMembers || []).map((m) => {
          const p = profileMap.get(m.user_id);
          return { id: m.user_id, name: p?.full_name || 'Team Member' };
        }),
      },
      reports: {
        tasks: taskReport,
        employees: employeeReport,
        departments: departmentReport,
      },
    });
  } catch (error: any) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
