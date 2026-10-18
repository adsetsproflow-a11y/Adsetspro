import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { ensureDepartmentChatRoom } from '@/lib/chat/rooms';

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
      return NextResponse.json({ error: 'Company workspace not found' }, { status: 404 });
    }

    // 3. Verify membership
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

    // 4. Fetch departments with head profile
    const { data: departments, error: deptErr } = await adminClient
      .from('departments')
      .select(`
        id,
        name,
        description,
        status,
        created_at,
        head_user_id,
        head:profiles!head_user_id(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('company_id', company.id)
      .order('name', { ascending: true });

    if (deptErr) {
      throw deptErr;
    }

    // 5. Gather counts for members and tasks per department
    const [deptMembersRes, tasksRes] = await Promise.all([
      adminClient
        .from('department_memberships')
        .select('department_id')
        .eq('status', 'active'),
      adminClient
        .from('tasks')
        .select('department_id, status')
        .eq('company_id', company.id)
        .neq('status', 'cancelled'),
    ]);

    const memberCounts: Record<string, number> = {};
    (deptMembersRes.data || []).forEach((m) => {
      memberCounts[m.department_id] = (memberCounts[m.department_id] || 0) + 1;
    });

    const taskCounts: Record<string, number> = {};
    (tasksRes.data || []).forEach((t) => {
      if (t.department_id) {
        taskCounts[t.department_id] = (taskCounts[t.department_id] || 0) + 1;
      }
    });

    const formattedDepartments = (departments || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description || '',
      status: d.status,
      created_at: d.created_at,
      head_user_id: d.head_user_id,
      head_name: d.head?.full_name || 'Unassigned',
      head_email: d.head?.email || null,
      employee_count: memberCounts[d.id] || 0,
      task_count: taskCounts[d.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      departments: formattedDepartments,
    });
  } catch (error: any) {
    console.error('Fetch departments error:', error);
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
    const { name, description, head_user_id } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
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
      .select('id, name')
      .eq('slug', companySlug)
      .single();

    if (compErr || !company) {
      return NextResponse.json({ error: 'Company workspace not found' }, { status: 404 });
    }

    // 3. Verify user has COMPANY_ADMIN or SUPER_ADMIN permission
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

      if (membership?.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Only Company Administrators can create departments' },
          { status: 403 }
        );
      }
    }

    // 4. Create department
    const { data: newDept, error: insertErr } = await adminClient
      .from('departments')
      .insert({
        company_id: company.id,
        name: name.trim(),
        description: description?.trim() || null,
        head_user_id: head_user_id || null,
        status: 'active',
      })
      .select('*')
      .single();

    if (insertErr) {
      if (insertErr.code === '23505') {
        return NextResponse.json(
          { error: `Department "${name}" already exists in this workspace.` },
          { status: 400 }
        );
      }
      throw insertErr;
    }

    // 5. If head assigned, update membership role to DEPARTMENT_HEAD if employee
    if (head_user_id) {
      await adminClient
        .from('company_memberships')
        .update({ role: 'DEPARTMENT_HEAD' })
        .eq('company_id', company.id)
        .eq('user_id', head_user_id)
        .eq('role', 'EMPLOYEE');

      // Create department membership for the head
      await adminClient
        .from('department_memberships')
        .upsert(
          {
            user_id: head_user_id,
            department_id: newDept.id,
            status: 'active',
          },
          { onConflict: 'user_id, department_id' }
        );
    }

    // Auto-create department chat room & enroll members
    await ensureDepartmentChatRoom(newDept.id, company.id, newDept.name);

    // 6. Write audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'DEPARTMENT_CREATED',
      target_id: newDept.id,
      target_type: 'department',
      details: {
        department_name: newDept.name,
        head_user_id: head_user_id || null,
      },
    });

    return NextResponse.json({
      success: true,
      department: newDept,
      message: `Department "${newDept.name}" created successfully.`,
    });
  } catch (error: any) {
    console.error('Create department error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
