import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, linkUrl, linkTitle } = body;

    if (!taskId || !linkUrl) {
      return NextResponse.json({ error: 'Task ID and Deliverable Link URL are required' }, { status: 400 });
    }

    let formattedUrl = linkUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Validate URL structure
    try {
      new URL(formattedUrl);
    } catch {
      return NextResponse.json({ error: 'Please provide a valid URL (e.g. https://figma.com/...)' }, { status: 400 });
    }

    // Verify task exists
    const { data: task, error: taskErr } = await adminClient
      .from('tasks')
      .select('id, company_id, title, task_url')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify membership or super admin
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, full_name, is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', task.company_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden: You must be an active member of this workspace to attach deliverable links' },
          { status: 403 }
        );
      }
    }

    // Compute next version
    const { data: latestAttachment } = await adminClient
      .from('task_attachments')
      .select('version')
      .eq('task_id', taskId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latestAttachment?.version || 0) + 1;
    const finalTitle = (linkTitle || '').trim() || formattedUrl;

    // Insert into task_attachments
    const { data: attachment, error: insertError } = await adminClient
      .from('task_attachments')
      .insert({
        task_id: taskId,
        storage_path: formattedUrl,
        file_name: finalTitle,
        file_size: 0,
        file_type: 'link',
        uploaded_by: user.id,
        version: nextVersion,
      })
      .select('*')
      .single();

    if (insertError || !attachment) {
      throw insertError || new Error('Failed to record deliverable link');
    }

    // Also update task_url if task doesn't have one set yet
    if (!task.task_url) {
      await adminClient
        .from('tasks')
        .update({ task_url: formattedUrl })
        .eq('id', taskId);
    }

    // Audit log
    await adminClient.from('task_activities').insert({
      task_id: taskId,
      actor_id: user.id,
      action: 'ATTACHMENT_ADDED',
      details: {
        file_name: finalTitle,
        link_url: formattedUrl,
        uploader_name: profile?.full_name || 'Team member',
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        id: attachment.id,
        taskId: attachment.task_id,
        fileName: attachment.file_name,
        fileSize: 0,
        fileType: 'link',
        storagePath: attachment.storage_path,
        version: attachment.version,
        createdAt: attachment.created_at,
        uploaderName: profile?.full_name || 'Team member',
      },
      message: 'Deliverable link attached successfully!',
    });
  } catch (err: any) {
    console.error('Error in /api/files/link:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

