import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; taskId: string }> }
) {
  try {
    const { companySlug, taskId } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
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

    // 4. Fetch task
    const { data: task, error: taskErr } = await adminClient
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('company_id', company.id)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 5. Batch 1: Parallel fetch related resources
    const [
      deptRes,
      projRes,
      reviewerRes,
      creatorRes,
      assignmentsRes,
      attachmentsRes,
      activitiesRes,
    ] = await Promise.all([
      task.department_id
        ? adminClient.from('departments').select('id, name').eq('id', task.department_id).maybeSingle()
        : Promise.resolve({ data: null }),
      task.project_id
        ? adminClient.from('projects').select('id, name').eq('id', task.project_id).maybeSingle()
        : Promise.resolve({ data: null }),
      task.reviewer_id
        ? adminClient.from('profiles').select('id, full_name, email, avatar_url').eq('id', task.reviewer_id).maybeSingle()
        : Promise.resolve({ data: null }),
      task.created_by
        ? adminClient.from('profiles').select('id, full_name, email').eq('id', task.created_by).maybeSingle()
        : Promise.resolve({ data: null }),
      adminClient.from('task_assignments').select('id, task_id, employee_id, assigned_by, assigned_at, ended_at, is_current').eq('task_id', taskId).order('assigned_at', { ascending: false }),
      adminClient.from('task_attachments').select('id, task_id, storage_path, file_name, file_size, file_type, uploaded_by, version, created_at').eq('task_id', taskId).order('created_at', { ascending: false }),
      adminClient.from('task_activities').select('id, actor_id, action, details, created_at').eq('task_id', taskId).order('created_at', { ascending: false }),
    ]);

    const department = deptRes.data || null;
    const project = projRes.data || null;
    const reviewer = reviewerRes.data || null;
    const creator = creatorRes.data || null;

    const assignments = assignmentsRes.data || [];
    const currentAssignment = assignments.find((a: any) => a.is_current) || null;
    const empIds = Array.from(new Set(assignments.map((a: any) => a.employee_id)));

    const rawAttachments = attachmentsRes.data || [];
    const uploaderIds = Array.from(new Set(rawAttachments.map((a: any) => a.uploaded_by).filter(Boolean))) as string[];

    const rawActivities = activitiesRes.data || [];
    const actorIds = Array.from(new Set(rawActivities.map((a: any) => a.actor_id).filter(Boolean))) as string[];

    // 6. Batch 2: Parallel fetch related profile metadata
    const [empProfilesRes, uploadersRes, actorsRes] = await Promise.all([
      empIds.length > 0
        ? adminClient.from('profiles').select('id, full_name, email, avatar_url').in('id', empIds)
        : Promise.resolve({ data: [] }),
      uploaderIds.length > 0
        ? adminClient.from('profiles').select('id, full_name').in('id', uploaderIds)
        : Promise.resolve({ data: [] }),
      actorIds.length > 0
        ? adminClient.from('profiles').select('id, full_name').in('id', actorIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Build assignment data
    const empMap = new Map<string, any>();
    (empProfilesRes.data || []).forEach((p: any) => empMap.set(p.id, p));

    let currentAssignee = null;
    if (currentAssignment) {
      const emp = empMap.get(currentAssignment.employee_id);
      if (emp) {
        currentAssignee = {
          id: emp.id,
          full_name: emp.full_name,
          email: emp.email,
          avatar_url: emp.avatar_url,
          assigned_at: currentAssignment.assigned_at,
        };
      }
    }

    const assignmentHistory = assignments.map((a: any) => {
      const emp = empMap.get(a.employee_id);
      return {
        id: a.id,
        employee_id: a.employee_id,
        full_name: emp?.full_name || 'Unknown',
        email: emp?.email || null,
        assigned_at: a.assigned_at,
        ended_at: a.ended_at,
        is_current: a.is_current,
      };
    });

    // Build attachment data
    let uploaderMap = new Map<string, string>();
    (uploadersRes.data || []).forEach((u: any) => uploaderMap.set(u.id, u.full_name));

    const attachments = rawAttachments.map((att: any) => ({
      id: att.id,
      task_id: att.task_id,
      storage_path: att.storage_path,
      file_name: att.file_name,
      file_size: att.file_size,
      file_type: att.file_type,
      version: att.version,
      uploaded_by: att.uploaded_by,
      uploader_name: (att.uploaded_by && uploaderMap.get(att.uploaded_by)) || 'Team Member',
      created_at: att.created_at,
    }));

    // Build activity data
    let actorMap = new Map<string, string>();
    (actorsRes.data || []).forEach((act: any) => actorMap.set(act.id, act.full_name));

    const activities = rawActivities.map((act: any) => ({
      id: act.id,
      action: act.action,
      details: act.details,
      created_at: act.created_at,
      actor_name: (act.actor_id && actorMap.get(act.actor_id)) || 'System',
    }));

    // 11. Calculate user permissions on this task
    const isAssignee = currentAssignee?.id === user.id;
    const isReviewer = task.reviewer_id === user.id;
    const isAdmin = userRole === 'COMPANY_ADMIN' || userRole === 'SUPER_ADMIN';
    const isDeptHead = userRole === 'DEPARTMENT_HEAD';

    return NextResponse.json({
      success: true,
      task: {
        ...task,
        department,
        project,
        assignee: currentAssignee,
        reviewer,
        creator,
      },
      assignmentHistory,
      attachments,
      activities,
      userPermissions: {
        userId: user.id,
        isAssignee,
        isReviewer,
        isAdmin,
        isDeptHead,
        canStartWorking: isAssignee && (task.status === 'assigned' || task.status === 'revision_required'),
        canSubmitForReview: isAssignee && task.status === 'in_progress',
        canApprove: (isReviewer || isAdmin) && task.status === 'submitted_for_review',
        canRequestRevision: (isReviewer || isAdmin) && task.status === 'submitted_for_review',
        canCancel: isAdmin && task.status !== 'cancelled' && task.status !== 'approved',
        canReassign: isAdmin || isDeptHead,
        canEdit: isAdmin || isDeptHead,
        canDelete: isAdmin || isDeptHead || task.created_by === user.id,
        canRevoke: (isReviewer || isAdmin || isDeptHead) && task.status === 'approved',
      },
    });
  } catch (error: any) {
    console.error('Fetch task details error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; taskId: string }> }
) {
  try {
    const { companySlug, taskId } = await params;
    const body = await request.json();
    const {
      title,
      description,
      priority,
      start_date,
      due_date,
      reviewer_id,
      department_id,
      project_id,
    } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: company } = await adminClient
      .from('companies')
      .select('id')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Verify user is Admin or Dept Head
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin, full_name')
      .eq('id', user.id)
      .single();

    let isAuthorized = Boolean(profile?.is_super_admin);
    if (!isAuthorized) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership?.role === 'COMPANY_ADMIN' || membership?.role === 'DEPARTMENT_HEAD') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Only company admins or department heads can edit task specifications.' },
        { status: 403 }
      );
    }

    // Build update payload
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (title && title.trim()) updatePayload.title = title.trim();
    if (description !== undefined) updatePayload.description = description.trim();
    if (priority) updatePayload.priority = priority;
    if (start_date !== undefined) updatePayload.start_date = start_date ? new Date(start_date).toISOString() : null;
    if (due_date !== undefined) updatePayload.due_date = due_date ? new Date(due_date).toISOString() : null;
    if (reviewer_id) {
      const { data: revProfile } = await adminClient
        .from('profiles')
        .select('is_super_admin')
        .eq('id', reviewer_id)
        .single();
      if (revProfile?.is_super_admin) {
        return NextResponse.json(
          { error: 'Platform Super Admin cannot be designated as a task reviewer.' },
          { status: 400 }
        );
      }
      updatePayload.reviewer_id = reviewer_id;
    }
    if (department_id !== undefined) updatePayload.department_id = department_id || null;
    if (project_id !== undefined) updatePayload.project_id = project_id || null;

    const { data: updatedTask, error: updateErr } = await adminClient
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .eq('company_id', company.id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    // Record activity
    await adminClient.from('task_activities').insert({
      task_id: taskId,
      actor_id: user.id,
      action: 'TASK_UPDATED',
      details: {
        updated_fields: Object.keys(updatePayload).filter((k) => k !== 'updated_at'),
        actor_name: profile?.full_name || 'Admin',
      },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: 'Task specifications updated successfully.',
    });
  } catch (error: any) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; taskId: string }> }
) {
  try {
    const { companySlug, taskId } = await params;
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

    // 3. Fetch task to check existence & department/creator
    const { data: task } = await adminClient
      .from('tasks')
      .select('id, title, department_id, created_by')
      .eq('id', taskId)
      .eq('company_id', company.id)
      .single();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 4. Verify user permissions
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin, full_name')
      .eq('id', user.id)
      .single();

    let isAuthorized = Boolean(profile?.is_super_admin);
    if (!isAuthorized) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership?.role === 'COMPANY_ADMIN' || membership?.role === 'DEPARTMENT_HEAD') {
        isAuthorized = true;
      } else if (task.created_by === user.id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this deliverable.' },
        { status: 403 }
      );
    }

    // 5. Delete task (cascades to assignments, comments, attachments, activities, chat rooms)
    const { error: deleteErr } = await adminClient
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('company_id', company.id);

    if (deleteErr) {
      throw deleteErr;
    }

    return NextResponse.json({
      success: true,
      message: `Task "${task.title}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

