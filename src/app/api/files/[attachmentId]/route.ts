import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const { attachmentId } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch attachment metadata
    const { data: attachment, error: attachErr } = await adminClient
      .from('task_attachments')
      .select(`
        id,
        task_id,
        storage_path,
        file_name,
        uploaded_by,
        tasks (
          id,
          company_id
        )
      `)
      .eq('id', attachmentId)
      .single();

    if (attachErr || !attachment) {
      return NextResponse.json({ error: 'File attachment not found.' }, { status: 404 });
    }

    const task = attachment.tasks as any;
    const isUploader = attachment.uploaded_by === user.id;

    // 3. Permission verification: uploader OR company admin / super admin
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    let isAuthorized = isUploader || Boolean(profile?.is_super_admin);

    if (!isAuthorized && task?.company_id) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', task.company_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership?.role === 'COMPANY_ADMIN') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Only the file uploader or a company administrator can delete this attachment.' },
        { status: 403 }
      );
    }

    // 4. Delete from Supabase Storage private bucket
    const { error: removeStorageErr } = await adminClient.storage
      .from('task-attachments')
      .remove([attachment.storage_path]);

    if (removeStorageErr) {
      console.warn('Storage deletion warning:', removeStorageErr.message);
    }

    // 5. Delete metadata from task_attachments
    const { error: dbDeleteErr } = await adminClient
      .from('task_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbDeleteErr) {
      throw dbDeleteErr;
    }

    // 6. Record in task_activities
    await adminClient.from('task_activities').insert({
      task_id: attachment.task_id,
      actor_id: user.id,
      action: 'ATTACHMENT_DELETED',
      details: {
        file_name: attachment.file_name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `File "${attachment.file_name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('DELETE /api/files/[attachmentId] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
