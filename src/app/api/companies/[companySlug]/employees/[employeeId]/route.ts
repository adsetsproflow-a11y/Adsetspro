import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getDbPool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; employeeId: string }> }
) {
  try {
    const { companySlug, employeeId } = await params;
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
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Fetch employee profile & company membership
    const [{ data: profile }, { data: membership }] = await Promise.all([
      adminClient
        .from('profiles')
        .select('*')
        .eq('id', employeeId)
        .single(),
      adminClient
        .from('company_memberships')
        .select('*')
        .eq('company_id', company.id)
        .eq('user_id', employeeId)
        .single(),
    ]);

    if (!profile || !membership || profile.is_super_admin) {
      return NextResponse.json({ error: 'Employee not found in this organization' }, { status: 404 });
    }

    // 4. Fetch department memberships
    const { data: deptMemberships } = await adminClient
      .from('department_memberships')
      .select(`
        id,
        status,
        created_at,
        department:departments!department_id(id, name),
        designation:designations!designation_id(id, name),
        reporting_to_profile:profiles!reporting_to(id, full_name, email)
      `)
      .eq('user_id', employeeId);

    // 5. Fetch assigned tasks
    const { data: assignmentsData } = await adminClient
      .from('task_assignments')
      .select('task_id, is_current, assigned_at')
      .eq('employee_id', employeeId)
      .order('assigned_at', { ascending: false });

    const assignments = assignmentsData || [];
    const taskIds = assignments.map((a) => a.task_id);

    let tasksMap = new Map<string, any>();
    if (taskIds.length > 0) {
      const { data: taskRecords } = await adminClient
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          created_at,
          updated_at,
          department:departments!department_id(name),
          project:projects!project_id(name)
        `)
        .in('id', taskIds);

      (taskRecords || []).forEach((t: any) => {
        tasksMap.set(t.id, t);
      });
    }

    const currentTasks = assignments
      .filter((a) => {
        const t = tasksMap.get(a.task_id);
        return a.is_current && t && t.status !== 'approved' && t.status !== 'cancelled';
      })
      .map((a) => {
        const t = tasksMap.get(a.task_id);
        return {
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          due_date: t.due_date,
          department_name: t.department?.name || 'General',
          project_name: t.project?.name || 'General',
          assigned_at: a.assigned_at,
        };
      });

    const taskHistory = assignments
      .filter((a) => tasksMap.has(a.task_id))
      .map((a) => {
        const t = tasksMap.get(a.task_id);
        return {
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          due_date: t.due_date,
          is_current: a.is_current,
          completed_at: t.status === 'approved' ? t.updated_at : null,
        };
      });

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
        account_status: profile.account_status,
        role: membership.role,
        membership_status: membership.status,
        created_at: profile.created_at,
        joined_at: membership.created_at,
      },
      departments: deptMemberships || [],
      current_tasks: currentTasks,
      task_history: taskHistory,
      currentUserId: user.id,
    });
  } catch (error: any) {
    console.error('Fetch employee detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; employeeId: string }> }
) {
  try {
    const { companySlug, employeeId } = await params;
    const body = await request.json();
    const { status, role } = body;

    const supabase = await createClient();

    // 1. Authenticate caller
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company & verify admin/dept head permission
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

    let isCompanyAdmin = Boolean(profile?.is_super_admin);
    let isDeptHead = false;

    if (!isCompanyAdmin) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership?.role === 'COMPANY_ADMIN') {
        isCompanyAdmin = true;
      } else if (membership?.role === 'DEPARTMENT_HEAD') {
        isDeptHead = true;
      }
    }

    if (!isCompanyAdmin && !isDeptHead) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Department Head authority required to manage employee status' },
        { status: 403 }
      );
    }

    // If caller is Department Head, check target role & department
    if (!isCompanyAdmin && isDeptHead) {
      const { data: targetMem } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', employeeId)
        .maybeSingle();

      if (targetMem?.role === 'COMPANY_ADMIN' || targetMem?.role === 'DEPARTMENT_HEAD') {
        return NextResponse.json(
          { error: 'Forbidden: Department Heads can only manage team employees.' },
          { status: 403 }
        );
      }
    }

    const { data: targetProfile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', employeeId)
      .single();

    if (targetProfile?.is_super_admin) {
      return NextResponse.json(
        { error: 'Cannot manage Platform Super Admin within company operations' },
        { status: 400 }
      );
    }

    // 3. Update company_memberships
    const updates: any = {};
    if (status) updates.status = status;
    if (role) updates.role = role;
    updates.updated_at = new Date().toISOString();

    const { data: updatedMem, error: memErr } = await adminClient
      .from('company_memberships')
      .update(updates)
      .eq('company_id', company.id)
      .eq('user_id', employeeId)
      .select('*')
      .single();

    if (memErr) {
      throw memErr;
    }

    // Also sync account_status on profile if suspended/deactivated/active
    if (status && ['active', 'suspended', 'deactivated'].includes(status)) {
      await adminClient
        .from('profiles')
        .update({ account_status: status as any })
        .eq('id', employeeId);
    }

    // 4. Audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'EMPLOYEE_STATUS_CHANGED',
      target_id: employeeId,
      target_type: 'employee',
      details: updates,
    });

    return NextResponse.json({
      success: true,
      membership: updatedMem,
      message: `Employee status successfully updated to "${status}".`,
    });
  } catch (error: any) {
    console.error('Update employee status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; employeeId: string }> }
) {
  try {
    const { companySlug, employeeId } = await params;
    const supabase = await createClient();

    // 1. Authenticate caller
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Prevent self-deletion
    if (user.id === employeeId) {
      return NextResponse.json(
        { error: 'Action denied: You cannot delete your own user account from this organization.' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // 3. Fetch company
    const compRes = await pool.query(
      `SELECT id, name FROM public.companies WHERE slug = $1 LIMIT 1;`,
      [companySlug]
    );

    if (compRes.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = compRes.rows[0];

    // 4. Check caller authority
    const profRes = await pool.query(
      `SELECT is_super_admin FROM public.profiles WHERE id = $1 LIMIT 1;`,
      [user.id]
    );
    const callerProfile = profRes.rows[0];

    let isCompanyAdmin = Boolean(callerProfile?.is_super_admin);
    let isDeptHead = false;

    if (!isCompanyAdmin) {
      const callerMemRes = await pool.query(
        `SELECT role FROM public.company_memberships 
         WHERE company_id = $1 AND user_id = $2 AND status = 'active' LIMIT 1;`,
        [company.id, user.id]
      );
      const callerRole = callerMemRes.rows[0]?.role;
      if (callerRole === 'COMPANY_ADMIN') {
        isCompanyAdmin = true;
      } else if (callerRole === 'DEPARTMENT_HEAD') {
        isDeptHead = true;
      }
    }

    if (!isCompanyAdmin && !isDeptHead) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges to delete employees.' },
        { status: 403 }
      );
    }

    // Target member check
    const targetMemRes = await pool.query(
      `SELECT cm.role, p.email, p.full_name, p.is_super_admin
       FROM public.company_memberships cm
       JOIN public.profiles p ON p.id = cm.user_id
       WHERE cm.company_id = $1 AND cm.user_id = $2 LIMIT 1;`,
      [company.id, employeeId]
    );

    if (targetMemRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found in this organization.' },
        { status: 404 }
      );
    }

    const target = targetMemRes.rows[0];

    if (target.is_super_admin) {
      return NextResponse.json(
        { error: 'Cannot delete Platform Super Admin from organization roster.' },
        { status: 400 }
      );
    }

    // If caller is DEPT_HEAD:
    // Can only delete standard EMPLOYEEs, not admins or department heads
    if (!isCompanyAdmin && isDeptHead) {
      if (target.role === 'COMPANY_ADMIN' || target.role === 'DEPARTMENT_HEAD') {
        return NextResponse.json(
          { error: 'Forbidden: Department Heads can only delete team employees, not administrators or department heads.' },
          { status: 403 }
        );
      }

      // Verify target is in the caller's department
      const deptMatchRes = await pool.query(
        `SELECT 1 FROM public.department_memberships dm1
         JOIN public.department_memberships dm2 ON dm1.department_id = dm2.department_id
         WHERE dm1.user_id = $1 AND dm2.user_id = $2 LIMIT 1;`,
        [user.id, employeeId]
      );

      if (deptMatchRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'Forbidden: You can only delete employees within your own department.' },
          { status: 403 }
        );
      }
    }

    // 5. Clean up employee associations
    // Unassign tasks
    await pool.query(
      `DELETE FROM public.task_assignments WHERE employee_id = $1;`,
      [employeeId]
    );

    // Delete department memberships
    await pool.query(
      `DELETE FROM public.department_memberships 
       WHERE user_id = $1 AND department_id IN (SELECT id FROM public.departments WHERE company_id = $2);`,
      [employeeId, company.id]
    );

    // Delete chat memberships
    await pool.query(
      `DELETE FROM public.chat_members 
       WHERE user_id = $1 AND room_id IN (SELECT id FROM public.chat_rooms WHERE company_id = $2);`,
      [employeeId, company.id]
    );

    // Delete company membership
    await pool.query(
      `DELETE FROM public.company_memberships 
       WHERE user_id = $1 AND company_id = $2;`,
      [employeeId, company.id]
    );

    // If user has no other memberships in any company, clean up their profile & auth
    const otherMemberships = await pool.query(
      `SELECT 1 FROM public.company_memberships WHERE user_id = $1 LIMIT 1;`,
      [employeeId]
    );

    if (otherMemberships.rows.length === 0) {
      await pool.query(`DELETE FROM public.notifications WHERE user_id = $1;`, [employeeId]);
      await pool.query(`DELETE FROM public.profiles WHERE id = $1;`, [employeeId]);
      await pool.query(`DELETE FROM auth.users WHERE id = $1;`, [employeeId]);
    }

    // Audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'EMPLOYEE_DELETED',
      target_id: employeeId,
      target_type: 'employee',
      details: { email: target.email, full_name: target.full_name, role: target.role },
    });

    return NextResponse.json({
      success: true,
      message: `Employee "${target.full_name}" (${target.email}) has been permanently deleted from this organization.`,
    });
  } catch (error: any) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
