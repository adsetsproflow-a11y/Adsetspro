import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; taskId: string }> }
) {
  try {
    const { companySlug, taskId } = await params;
    const body = await request.json();
    const { feedback, comment } = body;
    const reviewNote = (feedback || comment || '').trim();

    if (!reviewNote) {
      return NextResponse.json(
        { error: 'Revision feedback explaining what needs changes is required.' },
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

    // 3. Fetch user profile and role
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

    if (task.status !== 'submitted_for_review') {
      return NextResponse.json(
        { error: `Revision can only be requested on tasks in "submitted_for_review" status (currently "${task.status}").` },
        { status: 400 }
      );
    }

    // 5. Verify current assignee: reviewer cannot be the same as assignee
    const { data: assignment } = await adminClient
      .from('task_assignments')
      .select('employee_id')
      .eq('task_id', taskId)
      .eq('is_current', true)
      .maybeSingle();

    if (assignment?.employee_id === user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot review or request revisions on your own task deliverable.' },
        { status: 403 }
      );
    }

    // 6. Verify reviewer permission
    const isReviewer = task.reviewer_id === user.id;
    const isAdmin = userRole === 'COMPANY_ADMIN' || userRole === 'SUPER_ADMIN';
    const isDeptHead = userRole === 'DEPARTMENT_HEAD';

    if (!isReviewer && !isAdmin && !isDeptHead) {
      return NextResponse.json(
        { error: 'Forbidden: Only the designated reviewer, department head, or company admin can request revisions.' },
        { status: 403 }
      );
    }

    // 6. Update task status to revision_required
    const { data: updatedTask, error: updateErr } = await adminClient
      .from('tasks')
      .update({
        status: 'revision_required',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select('*')
      .single();

    if (updateErr) {
      throw updateErr;
    }

    // 7. Insert review comment into task_comments
    const { data: newComment } = await adminClient
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: user.id,
        content: reviewNote,
        is_review_comment: true,
      })
      .select('*')
      .single();

    // 8. Write to task_activities
    await adminClient.from('task_activities').insert({
      task_id: taskId,
      actor_id: user.id,
      action: 'REVISION_REQUESTED',
      details: {
        reviewer_name: profile?.full_name || 'Reviewer',
        feedback: reviewNote,
      },
    });

    // 9. Notify assignee
    if (assignment?.employee_id) {
      await adminClient.from('notifications').insert({
        user_id: assignment.employee_id,
        company_id: company.id,
        type: 'REVISION_REQUIRED',
        title: 'Revision Requested on Task',
        body: `Changes requested on "${task.title}": "${reviewNote.slice(0, 120)}${reviewNote.length > 120 ? '...' : ''}"`,
        payload: { task_id: taskId, comment_id: newComment?.id },
      });
    }

    // 10. Audit log
    await adminClient.from('audit_logs').insert({
      company_id: company.id,
      actor_id: user.id,
      action: 'REVISION_REQUESTED',
      target_type: 'task',
      target_id: taskId,
      details: { task_title: task.title, feedback_preview: reviewNote.slice(0, 80) },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      comment: newComment,
      message: 'Revision requested and feedback recorded.',
    });
  } catch (error: any) {
    console.error('Request revision error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
