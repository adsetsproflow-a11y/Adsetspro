import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({
        success: true,
        results: {
          tasks: [],
          employees: [],
          projects: [],
          departments: [],
        },
      });
    }

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

    // 3. Verify user membership and role
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    let userRole = 'EMPLOYEE';
    let userDeptId: string | null = null;

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

      // Find user's department if department head or employee
      const { data: deptMember } = await adminClient
        .from('department_memberships')
        .select('department_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      userDeptId = deptMember?.department_id || null;
    } else {
      userRole = 'SUPER_ADMIN';
    }

    const searchPattern = `%${query}%`;

    // 4. Query Tasks
    let taskQuery = adminClient
      .from('tasks')
      .select('id, title, status, priority, due_date, department_id')
      .eq('company_id', company.id)
      .ilike('title', searchPattern)
      .limit(6);

    // Filter tasks if regular employee
    if (userRole === 'EMPLOYEE') {
      // Find tasks assigned to user
      const { data: assignedTasks } = await adminClient
        .from('task_assignments')
        .select('task_id')
        .eq('employee_id', user.id)
        .eq('is_current', true);

      const assignedIds = (assignedTasks || []).map((a) => a.task_id);
      if (assignedIds.length > 0) {
        taskQuery = taskQuery.or(`created_by.eq.${user.id},id.in.(${assignedIds.join(',')})`);
      } else {
        taskQuery = taskQuery.eq('created_by', user.id);
      }
    } else if (userRole === 'DEPARTMENT_HEAD' && userDeptId) {
      taskQuery = taskQuery.or(`department_id.eq.${userDeptId},created_by.eq.${user.id}`);
    }

    // 5. Query Employees (Company Members)
    const { data: memberRows } = await adminClient
      .from('company_memberships')
      .select('user_id, role')
      .eq('company_id', company.id)
      .eq('status', 'active');

    const memberUserIds = (memberRows || []).map((m) => m.user_id);
    const memberRoleMap = new Map<string, string>();
    (memberRows || []).forEach((m) => memberRoleMap.set(m.user_id, m.role));

    let employeeQuery = adminClient
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', memberUserIds.length > 0 ? memberUserIds : ['00000000-0000-0000-0000-000000000000'])
      .eq('is_super_admin', false)
      .or(`full_name.ilike.${searchPattern},email.ilike.${searchPattern}`)
      .limit(6);

    // 6. Query Projects
    const projectQuery = adminClient
      .from('projects')
      .select('id, name, status, description')
      .eq('company_id', company.id)
      .ilike('name', searchPattern)
      .limit(6);

    // 7. Query Departments
    const departmentQuery = adminClient
      .from('departments')
      .select('id, name, description, status')
      .eq('company_id', company.id)
      .ilike('name', searchPattern)
      .limit(6);

    const [tasksRes, employeesRes, projectsRes, departmentsRes] = await Promise.all([
      taskQuery,
      employeeQuery,
      projectQuery,
      departmentQuery,
    ]);

    const formattedTasks = (tasksRes.data || []).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      href: `/c/${companySlug}/tasks/${t.id}`,
    }));

    const formattedEmployees = (employeesRes.data || []).map((e) => ({
      id: e.id,
      name: e.full_name || 'Team Member',
      email: e.email,
      avatarUrl: e.avatar_url,
      role: memberRoleMap.get(e.id) || 'EMPLOYEE',
      href: `/c/${companySlug}/employees/${e.id}`,
    }));

    const formattedProjects = (projectsRes.data || []).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      href: `/c/${companySlug}/projects/${p.id}`,
    }));

    const formattedDepartments = (departmentsRes.data || []).map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      status: d.status,
      href: `/c/${companySlug}/departments/${d.id}`,
    }));

    return NextResponse.json({
      success: true,
      query,
      results: {
        tasks: formattedTasks,
        employees: formattedEmployees,
        projects: formattedProjects,
        departments: formattedDepartments,
      },
    });
  } catch (error: any) {
    console.error('Global search error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
