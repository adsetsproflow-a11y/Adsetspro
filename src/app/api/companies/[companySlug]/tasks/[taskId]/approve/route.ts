import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; taskId: string }> }
) {
  try {
    const { companySlug, taskId } = await params;
    const body = await request.json().catch(() => ({}));
    const { feedback } = body;

    const supabase = await createClient();

    // 1. Authenticate user
    let user: any = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {}

    if (!user) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('saaa_session')?.value;
      if (sessionCookie) {
        try {
          const raw = sessionCookie.includes('%') ? decodeURIComponent(sessionCookie) : sessionCookie;
          const decoded = Buffer.from(raw, 'base64').toString('utf8');
          const parsed = JSON.parse(decoded);
          if (parsed?.id) user = parsed;
        } catch {}
      }
    }

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
        { error: `Task cannot be approved from current status "${task.status}". It must be "submitted_for_review".` },
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
        { error: 'Forbidden: You cannot review or approve your own task deliverable.' },
        { status: 403 }
      );
    }

    // 6. Verify reviewer permission
    const isReviewer = task.reviewer_id === user.id;
    const isAdmin = userRole === 'COMPANY_ADMIN' || userRole === 'SUPER_ADMIN';
    const isDeptHead = userRole === 'DEPARTMENT_HEAD';

    if (!isReviewer && !isAdmin && !isDeptHead) {
      return NextResponse.json(
        { error: 'Forbidden: Only the designated reviewer or company admin can approve this task.' },
        { status: 403 }
      );
    }

    // 7. Update task status to approved
    const { data: updatedTask, error: updateErr } = await adminClient
      .from('tasks')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select('*')
      .single();

    if (updateErr) {
      throw updateErr;
    }

    // 7. Write to task_activities
    await adminClient.from('task_activities').insert({
      task_id: taskId,
      actor_id: user.id,
      action: 'TASK_APPROVED',
      details: {
        reviewer_name: profile?.full_name || 'Reviewer',
        feedback: feedback || null,
      },
    });

    // 8. If optional praise feedback provided, insert into comments
    if (feedback && typeof feedback === 'string' && feedback.trim()) {
      await adminClient.from('task_comments').insert({
        task_id: taskId,
        user_id: user.id,
        content: `Approval note: ${feedback.trim()}`,
        is_review_comment: true,
      });
    }

    // 9. Notify assignee and Department Head
    const approveNotifs: any[] = [];

    if (assignment?.employee_id && assignment.employee_id !== user.id) {
      approveNotifs.push({
        user_id: assignment.employee_id,
        company_id: company.id,
        type: 'TASK_APPROVED',
        title: 'Task Approved! 🎉',
        body: `Your submission for task "${task.title}" has been approved by ${profile?.full_name || 'the reviewer'}.`,
        payload: { task_id: taskId },
      });
    }

    if (task.department_id) {
      const { data: dept } = await adminClient
        .from('departments')
        .select('head_user_id')
        .eq('id', task.department_id)
        .single();
      if (dept?.head_user_id && dept.head_user_id !== user.id && dept.head_user_id !== assignment?.employee_id) {
        approveNotifs.push({
          user_id: dept.head_user_id,
          company_id: company.id,
          type: 'TASK_APPROVED',
          title: 'Department Task Approved',
          body: `Task "${task.title}" was approved by ${profile?.full_name || 'Admin'}.`,
          payload: { task_id: taskId },
        });
      }
    }

    if (approveNotifs.length > 0) {
      await adminClient.from('notifications').insert(approveNotifs);
    }

    // 10. Audit log
    await adminClient.from('audit_logs').insert({
      company_id: company.id,
      actor_id: user.id,
      action: 'TASK_APPROVED',
      target_type: 'task',
      target_id: taskId,
      details: { task_title: task.title },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: 'Task successfully approved!',
    });
  } catch (error: any) {
    console.error('Approve task error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
