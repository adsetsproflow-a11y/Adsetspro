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

    // 2. Fetch company
    const { data: company } = await adminClient
      .from('companies')
      .select('id, name')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Verify user membership
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

    // 5. Fetch department & project names if present
    let department = null;
    if (task.department_id) {
      const { data: dept } = await adminClient
        .from('departments')
        .select('id, name')
        .eq('id', task.department_id)
        .maybeSingle();
      department = dept || null;
    }

    let project = null;
    if (task.project_id) {
      const { data: proj } = await adminClient
        .from('projects')
        .select('id, name')
        .eq('id', task.project_id)
        .maybeSingle();
      project = proj || null;
    }

    // 6. Fetch Reviewer profile
    let reviewer = null;
    if (task.reviewer_id) {
      const { data: rev } = await adminClient
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', task.reviewer_id)
        .maybeSingle();
      reviewer = rev || null;
    }

    // 7. Fetch Creator profile
    let creator = null;
    if (task.created_by) {
      const { data: crt } = await adminClient
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', task.created_by)
        .maybeSingle();
      creator = crt || null;
    }

    // 8. Fetch current assignment and assignment history
    const { data: rawAssignments } = await adminClient
      .from('task_assignments')
      .select('id, task_id, employee_id, assigned_by, assigned_at, ended_at, is_current')
      .eq('task_id', taskId)
      .order('assigned_at', { ascending: false });

    const assignments = rawAssignments || [];
    const currentAssignment = assignments.find((a) => a.is_current) || null;

    // Fetch profile info for employees in assignments
    const empIds = Array.from(new Set(assignments.map((a) => a.employee_id)));
    let currentAssignee = null;
    let assignmentHistory: any[] = [];

    if (empIds.length > 0) {
      const { data: empProfiles } = await adminClient
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', empIds);

      const empMap = new Map<string, any>();
      (empProfiles || []).forEach((p) => empMap.set(p.id, p));

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

      assignmentHistory = assignments.map((a) => {
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
    }

    // 9. Fetch task attachments
    const { data: rawAttachments } = await adminClient
      .from('task_attachments')
      .select('id, task_id, file_name, file_size, file_type, uploaded_by, version, created_at')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    // Fetch uploader profiles
    const uploaderIds = Array.from(new Set((rawAttachments || []).map((a) => a.uploaded_by).filter(Boolean))) as string[];
    let uploaderMap = new Map<string, string>();
    if (uploaderIds.length > 0) {
      const { data: uploaders } = await adminClient
        .from('profiles')
        .select('id, full_name')
        .in('id', uploaderIds);
      (uploaders || []).forEach((u) => uploaderMap.set(u.id, u.full_name));
    }

    const attachments = (rawAttachments || []).map((att) => ({
      id: att.id,
      task_id: att.task_id,
      file_name: att.file_name,
      file_size: att.file_size,
      file_type: att.file_type,
      version: att.version,
      uploaded_by: att.uploaded_by,
      uploader_name: (att.uploaded_by && uploaderMap.get(att.uploaded_by)) || 'Team Member',
      created_at: att.created_at,
    }));

    // 10. Fetch task activities
    const { data: rawActivities } = await adminClient
      .from('task_activities')
      .select('id, actor_id, action, details, created_at')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    // Fetch actor profiles for activities
    const actorIds = Array.from(new Set((rawActivities || []).map((a) => a.actor_id).filter(Boolean))) as string[];
    let actorMap = new Map<string, string>();
    if (actorIds.length > 0) {
      const { data: actors } = await adminClient
        .from('profiles')
        .select('id, full_name')
        .in('id', actorIds);
      (actors || []).forEach((act) => actorMap.set(act.id, act.full_name));
    }

    const activities = (rawActivities || []).map((act) => ({
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
