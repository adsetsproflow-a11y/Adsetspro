import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; departmentId: string }> }
) {
  try {
    const { companySlug, departmentId } = await params;
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

    // 3. Fetch Department Details
    const { data: department, error: deptErr } = await adminClient
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
          avatar_url,
          phone
        )
      `)
      .eq('id', departmentId)
      .eq('company_id', company.id)
      .single();

    if (deptErr || !department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // 4. Fetch Department Members
    const { data: members } = await adminClient
      .from('department_memberships')
      .select(`
        id,
        status,
        created_at,
        user:profiles!user_id(
          id,
          full_name,
          email,
          avatar_url
        ),
        designation:designations!designation_id(
          id,
          name
        ),
        manager:profiles!reporting_to(
          id,
          full_name
        )
      `)
      .eq('department_id', departmentId)
      .order('created_at', { ascending: false });

    // 5. Fetch Department Tasks Summary
    const { data: tasks } = await adminClient
      .from('tasks')
      .select('id, title, status, priority, due_date, created_at')
      .eq('department_id', departmentId)
      .order('created_at', { ascending: false })
      .limit(10);

    const taskCounts = {
      total: (tasks || []).length,
      in_progress: (tasks || []).filter((t) => t.status === 'in_progress').length,
      submitted_for_review: (tasks || []).filter((t) => t.status === 'submitted_for_review').length,
      approved: (tasks || []).filter((t) => t.status === 'approved').length,
    };

    return NextResponse.json({
      success: true,
      department,
      members: members || [],
      tasks: tasks || [],
      task_summary: taskCounts,
    });
  } catch (error: any) {
    console.error('Fetch department detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; departmentId: string }> }
) {
  try {
    const { companySlug, departmentId } = await params;
    const body = await request.json();
    const { name, description, status } = body;

    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company & verify admin permission
    const { data: company } = await adminClient
      .from('companies')
      .select('id')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership?.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Admin authority required' },
          { status: 403 }
        );
      }
    }

    // 3. Update department
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (status !== undefined) updates.status = status;
    updates.updated_at = new Date().toISOString();

    const { data: updated, error: updateErr } = await adminClient
      .from('departments')
      .update(updates)
      .eq('id', departmentId)
      .eq('company_id', company.id)
      .select('*')
      .single();

    if (updateErr) {
      throw updateErr;
    }

    // 4. Audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'DEPARTMENT_UPDATED',
      target_id: departmentId,
      target_type: 'department',
      details: updates,
    });

    return NextResponse.json({
      success: true,
      department: updated,
      message: 'Department updated successfully.',
    });
  } catch (error: any) {
    console.error('Update department error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; departmentId: string }> }
) {
  try {
    const { companySlug, departmentId } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company & verify admin permission
    const { data: company } = await adminClient
      .from('companies')
      .select('id')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership?.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Admin authority required' },
          { status: 403 }
        );
      }
    }

    // 3. Archive department
    const { data: archived, error: archErr } = await adminClient
      .from('departments')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', departmentId)
      .eq('company_id', company.id)
      .select('*')
      .single();

    if (archErr) {
      throw archErr;
    }

    // 4. Audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'DEPARTMENT_ARCHIVED',
      target_id: departmentId,
      target_type: 'department',
      details: { department_name: archived.name },
    });

    return NextResponse.json({
      success: true,
      message: `Department "${archived.name}" has been archived.`,
    });
  } catch (error: any) {
    console.error('Archive department error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
