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
      .select('id')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Fetch comments
    const { data: rawComments, error: commentErr } = await adminClient
      .from('task_comments')
      .select('id, task_id, user_id, content, is_review_comment, created_at')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (commentErr) {
      throw commentErr;
    }

    const comments = rawComments || [];

    // Fetch user profiles for commenters
    const userIds = Array.from(new Set(comments.map((c) => c.user_id)));
    let userMap = new Map<string, { full_name: string; email: string; avatar_url: string | null }>();

    if (userIds.length > 0) {
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      (profiles || []).forEach((p) => {
        userMap.set(p.id, {
          full_name: p.full_name,
          email: p.email,
          avatar_url: p.avatar_url,
        });
      });
    }

    const formattedComments = comments.map((c) => {
      const author = userMap.get(c.user_id);
      return {
        id: c.id,
        task_id: c.task_id,
        user_id: c.user_id,
        content: c.content,
        is_review_comment: c.is_review_comment,
        created_at: c.created_at,
        author_name: author?.full_name || 'Team member',
        author_email: author?.email || null,
        author_avatar: author?.avatar_url || null,
      };
    });

    return NextResponse.json({
      success: true,
      comments: formattedComments,
    });
  } catch (error: any) {
    console.error('Fetch comments error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; taskId: string }> }
) {
  try {
    const { companySlug, taskId } = await params;
    const body = await request.json();
    const { content, is_review_comment } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
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
      .select('id')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Fetch author profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, avatar_url, email')
      .eq('id', user.id)
      .single();

    // 4. Fetch task
    const { data: task } = await adminClient
      .from('tasks')
      .select('id, title, reviewer_id, department_id')
      .eq('id', taskId)
      .single();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 5. Insert comment
    const { data: newComment, error: insertErr } = await adminClient
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: user.id,
        content: content.trim(),
        is_review_comment: Boolean(is_review_comment),
      })
      .select('*')
      .single();

    if (insertErr || !newComment) {
      throw insertErr || new Error('Failed to create comment');
    }

    // 6. Write to task_activities
    await adminClient.from('task_activities').insert({
      task_id: taskId,
      actor_id: user.id,
      action: 'COMMENT_ADDED',
      details: {
        comment_id: newComment.id,
        is_review_comment: newComment.is_review_comment,
        author_name: profile?.full_name || 'Team member',
      },
    });

    // 7. Notify other party (reviewer or assignee)
    const { data: currentAssignment } = await adminClient
      .from('task_assignments')
      .select('employee_id')
      .eq('task_id', taskId)
      .eq('is_current', true)
      .maybeSingle();

    const recipientIds = new Set<string>();

    if (user.id === currentAssignment?.employee_id) {
      // Employee commented -> Notify reviewer, dept head, and company admins
      if (task.reviewer_id && task.reviewer_id !== user.id) {
        recipientIds.add(task.reviewer_id);
      }
      if (task.department_id) {
        const { data: dept } = await adminClient
          .from('departments')
          .select('head_user_id')
          .eq('id', task.department_id)
          .single();
        if (dept?.head_user_id && dept.head_user_id !== user.id) {
          recipientIds.add(dept.head_user_id);
        }
      }
      const { data: admins } = await adminClient
        .from('company_memberships')
        .select('user_id')
        .eq('company_id', company.id)
        .eq('role', 'COMPANY_ADMIN')
        .eq('status', 'active');
      (admins || []).forEach((adm) => {
        if (adm.user_id !== user.id) recipientIds.add(adm.user_id);
      });
    } else {
      // Admin / Dept Head / Reviewer commented -> Notify the assigned employee!
      if (currentAssignment?.employee_id && currentAssignment.employee_id !== user.id) {
        recipientIds.add(currentAssignment.employee_id);
      }
    }

    for (const rid of recipientIds) {
      await adminClient.from('notifications').insert({
        user_id: rid,
        company_id: company.id,
        type: 'COMMENT_ADDED',
        title: 'New Comment on Task',
        body: `${profile?.full_name || 'A team member'} commented on "${task.title}": "${content.trim().slice(0, 100)}"`,
        payload: { task_id: taskId, comment_id: newComment.id },
      });
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...newComment,
        author_name: profile?.full_name || 'Team member',
        author_email: profile?.email || null,
        author_avatar: profile?.avatar_url || null,
      },
      message: 'Comment posted successfully.',
    });
  } catch (error: any) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
