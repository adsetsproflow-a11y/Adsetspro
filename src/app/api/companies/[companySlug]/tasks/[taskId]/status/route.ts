import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; taskId: string }> }
) {
  try {
    const { companySlug, taskId } = await params;
    const body = await request.json();
    const { status: targetStatus, note } = body;

    const validStatuses = [
      'assigned',
      'in_progress',
      'submitted_for_review',
      'revision_required',
      'approved',
      'blocked',
      'cancelled',
    ];

    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
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
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Verify user membership and role
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin, full_name')
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

    // 5. Fetch current assignment to identify assignee
    const { data: assignment } = await adminClient
      .from('task_assignments')
      .select('employee_id')
      .eq('task_id', taskId)
      .eq('is_current', true)
      .maybeSingle();

    const isAssignee = assignment?.employee_id === user.id;
    const isReviewer = task.reviewer_id === user.id;
    const isAdmin = userRole === 'COMPANY_ADMIN' || userRole === 'SUPER_ADMIN';
    const isDeptHead = userRole === 'DEPARTMENT_HEAD';

    const currentStatus = task.status;

    // 6. Enforce Server-Side Status Transition Rules
    let isAllowed = false;
    let denialReason = '';

    if (isAdmin) {
      // Admins have full override capabilities
      isAllowed = true;
    } else if (isAssignee) {
      // Employee rules:
      // assigned -> in_progress
      // in_progress -> submitted_for_review
      // revision_required -> in_progress or direct submitted_for_review
      // submitted_for_review -> submitted_for_review (re-submitting or updating deliverable)
      if (currentStatus === 'assigned' && targetStatus === 'in_progress') {
        isAllowed = true;
      } else if (
        (currentStatus === 'in_progress' || currentStatus === 'revision_required' || currentStatus === 'submitted_for_review') &&
        targetStatus === 'submitted_for_review'
      ) {
        isAllowed = true;
      } else if (currentStatus === 'revision_required' && targetStatus === 'in_progress') {
        isAllowed = true;
      } else if (targetStatus === 'blocked') {
        isAllowed = true;
      } else {
        denialReason = `Assignee cannot transition from ${currentStatus} to ${targetStatus}.`;
      }
    } else if (isReviewer || isDeptHead) {
      // Reviewer / Dept Head rules:
      // submitted_for_review -> approved or revision_required
      // approved -> revision_required or in_progress (revoke approval / reopen)
      // revision_required -> in_progress
      // assigned -> in_progress
      if (
        currentStatus === 'submitted_for_review' &&
        (targetStatus === 'approved' || targetStatus === 'revision_required')
      ) {
        isAllowed = true;
      } else if (
        currentStatus === 'approved' &&
        (targetStatus === 'revision_required' || targetStatus === 'in_progress')
      ) {
        isAllowed = true;
      } else if (currentStatus === 'revision_required' && targetStatus === 'in_progress') {
        isAllowed = true;
      } else if (currentStatus === 'assigned' && targetStatus === 'in_progress') {
        isAllowed = true;
      } else if (targetStatus === 'blocked') {
        isAllowed = true;
      } else {
        denialReason = `Reviewer cannot transition from ${currentStatus} to ${targetStatus}.`;
      }
    } else {
      denialReason = 'You are neither the assignee, the reviewer, nor an administrator for this task.';
    }

    if (!isAllowed) {
      return NextResponse.json(
        { error: `Forbidden: ${denialReason}` },
        { status: 403 }
      );
    }

    // 7. Update status
    const { data: updatedTask, error: updateErr } = await adminClient
      .from('tasks')
      .update({
        status: targetStatus as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select('*')
      .single();

    if (updateErr) {
      throw updateErr;
    }

    // 8. Write to task_activities
    await adminClient.from('task_activities').insert({
      task_id: taskId,
      actor_id: user.id,
      action: 'STATUS_CHANGED',
      details: {
        from_status: currentStatus,
        to_status: targetStatus,
        note: note || null,
        actor_name: profile?.full_name || 'Team member',
      },
    });

    // 9. Dispatch notifications
    const notificationsToInsert: any[] = [];

    if (targetStatus === 'submitted_for_review' && task.reviewer_id) {
      notificationsToInsert.push({
        user_id: task.reviewer_id,
        company_id: company.id,
        type: 'TASK_SUBMITTED',
        title: 'Task Submitted for Review',
        body: `${profile?.full_name || 'Assignee'} submitted task "${task.title}" for your review.`,
        payload: { task_id: taskId },
      });
    } else if (targetStatus === 'approved' && assignment?.employee_id) {
      notificationsToInsert.push({
        user_id: assignment.employee_id,
        company_id: company.id,
        type: 'TASK_APPROVED',
        title: 'Task Approved! 🎉',
        body: `Your deliverable for "${task.title}" has been approved by ${profile?.full_name || 'the reviewer'}.`,
        payload: { task_id: taskId },
      });
    } else if (targetStatus === 'revision_required' && assignment?.employee_id) {
      notificationsToInsert.push({
        user_id: assignment.employee_id,
        company_id: company.id,
        type: 'REVISION_REQUIRED',
        title: 'Revision Requested on Task',
        body: `Changes have been requested for "${task.title}". Please review the feedback.`,
        payload: { task_id: taskId },
      });
    } else if (targetStatus === 'cancelled') {
      if (assignment?.employee_id && assignment.employee_id !== user.id) {
        notificationsToInsert.push({
          user_id: assignment.employee_id,
          company_id: company.id,
          type: 'TASK_CANCELLED',
          title: 'Task Cancelled',
          body: `Task "${task.title}" was cancelled by ${profile?.full_name || 'an administrator'}.`,
          payload: { task_id: taskId },
        });
      }
    }

    if (notificationsToInsert.length > 0) {
      await adminClient.from('notifications').insert(notificationsToInsert);
    }

    // 10. Write audit log
    await adminClient.from('audit_logs').insert({
      company_id: company.id,
      actor_id: user.id,
      action: 'TASK_STATUS_UPDATED',
      target_type: 'task',
      target_id: taskId,
      details: {
        from_status: currentStatus,
        to_status: targetStatus,
      },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: `Task status updated from ${currentStatus} to ${targetStatus}.`,
    });
  } catch (error: any) {
    console.error('Update task status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
