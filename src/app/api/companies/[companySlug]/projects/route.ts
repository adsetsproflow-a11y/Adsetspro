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
    const departmentFilter = url.searchParams.get('department_id');
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

    // 3. Verify user is active member or super admin
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

    // 4. Fetch projects
    let query = adminClient
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        priority,
        start_date,
        due_date,
        created_at,
        department_id,
        manager_id,
        department:departments!department_id(
          id,
          name
        ),
        manager:profiles!manager_id(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter as any);
    }

    if (priorityFilter && priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter as any);
    }

    if (departmentFilter && departmentFilter !== 'all') {
      query = query.eq('department_id', departmentFilter);
    }

    if (startDateFilter) {
      query = query.gte('start_date', new Date(startDateFilter).toISOString());
    }

    if (endDateFilter) {
      const end = new Date(endDateFilter);
      end.setHours(23, 59, 59, 999);
      query = query.lte('due_date', end.toISOString());
    }

    const { data: rawProjects, error: projErr } = await query;

    if (projErr) {
      throw projErr;
    }

    // 5. Calculate real task progress for each project
    // Fetch all non-cancelled tasks for this company's projects
    const projectIds = (rawProjects || []).map((p) => p.id);
    let taskStatsMap = new Map<string, { total: number; approved: number }>();

    if (projectIds.length > 0) {
      const { data: tasks } = await adminClient
        .from('tasks')
        .select('id, project_id, status')
        .in('project_id', projectIds);

      (tasks || []).forEach((t) => {
        if (!t.project_id) return;
        const current = taskStatsMap.get(t.project_id) || { total: 0, approved: 0 };
        if (t.status !== 'cancelled') {
          current.total++;
          if (t.status === 'approved') {
            current.approved++;
          }
        }
        taskStatsMap.set(t.project_id, current);
      });
    }

    let projects = (rawProjects || []).map((p: any) => {
      const stats = taskStatsMap.get(p.id) || { total: 0, approved: 0 };
      const progress = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        status: p.status,
        priority: p.priority,
        start_date: p.start_date,
        due_date: p.due_date,
        created_at: p.created_at,
        department_name: p.department?.name || 'General',
        department_id: p.department_id,
        manager_name: p.manager?.full_name || 'Unassigned',
        manager_email: p.manager?.email || null,
        manager_avatar: p.manager?.avatar_url || null,
        progress,
        total_tasks: stats.total,
        approved_tasks: stats.approved,
      };
    });

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      projects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.department_name.toLowerCase().includes(q) ||
          p.manager_name.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error: any) {
    console.error('Fetch projects error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const body = await request.json();
    const { name, description, department_id, manager_id, start_date, due_date, priority } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
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
    const { data: company } = await adminClient
      .from('companies')
      .select('id, name')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company workspace not found' }, { status: 404 });
    }

    // 3. Verify user permissions
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

      if (!membership || (membership.role !== 'COMPANY_ADMIN' && membership.role !== 'DEPARTMENT_HEAD')) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions to create projects.' },
          { status: 403 }
        );
      }
    }

    // 4. Create project
    const { data: newProject, error: createErr } = await adminClient
      .from('projects')
      .insert({
        company_id: company.id,
        name: name.trim(),
        description: description?.trim() || null,
        department_id: department_id || null,
        manager_id: manager_id || null,
        start_date: start_date ? new Date(start_date).toISOString() : null,
        due_date: due_date ? new Date(due_date).toISOString() : null,
        priority: priority || 'medium',
        status: 'active',
        created_by: user.id,
      })
      .select('*')
      .single();

    if (createErr) {
      throw createErr;
    }

    // 5. Write to audit_logs
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'PROJECT_CREATED',
      target_id: newProject.id,
      target_type: 'project',
      details: {
        project_name: newProject.name,
        priority: newProject.priority,
        department_id: newProject.department_id,
        manager_id: newProject.manager_id,
      },
    });

    return NextResponse.json({
      success: true,
      project: newProject,
      message: `Project "${newProject.name}" created successfully.`,
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
