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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: rawAttachments, error: attachErr } = await adminClient
      .from('task_attachments')
      .select('id, task_id, storage_path, file_name, file_size, file_type, uploaded_by, version, created_at')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (attachErr) throw attachErr;

    const attachments = rawAttachments || [];
    const uploaderIds = Array.from(new Set(attachments.map((a) => a.uploaded_by).filter(Boolean))) as string[];

    let uploaderMap = new Map<string, string>();
    if (uploaderIds.length > 0) {
      const { data: uploaders } = await adminClient
        .from('profiles')
        .select('id, full_name')
        .in('id', uploaderIds);
      (uploaders || []).forEach((u) => uploaderMap.set(u.id, u.full_name));
    }

    const formatted = attachments.map((a) => ({
      ...a,
      uploader_name: (a.uploaded_by && uploaderMap.get(a.uploaded_by)) || 'Team Member',
    }));

    return NextResponse.json({
      success: true,
      attachments: formatted,
    });
  } catch (error: any) {
    console.error('Fetch attachments error:', error);
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
    const { file_name, file_size, file_type, storage_path } = body;

    if (!file_name || !storage_path) {
      return NextResponse.json({ error: 'File name and storage path are required' }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data: attachment, error: insertErr } = await adminClient
      .from('task_attachments')
      .insert({
        task_id: taskId,
        file_name: file_name.trim(),
        file_size: Number(file_size) || 1024,
        file_type: file_type || 'application/octet-stream',
        storage_path: storage_path.trim(),
        uploaded_by: user.id,
      })
      .select('*')
      .single();

    if (insertErr || !attachment) {
      throw insertErr || new Error('Failed to record attachment');
    }

    // Write to task_activities
    await adminClient.from('task_activities').insert({
      task_id: taskId,
      actor_id: user.id,
      action: 'ATTACHMENT_ADDED',
      details: {
        file_name: attachment.file_name,
        file_size: attachment.file_size,
        uploader_name: profile?.full_name || 'Team member',
      },
    });

    return NextResponse.json({
      success: true,
      attachment: {
        ...attachment,
        uploader_name: profile?.full_name || 'Team member',
      },
      message: 'Attachment uploaded successfully.',
    });
  } catch (error: any) {
    console.error('Upload attachment error:', error);
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
    const url = new URL(request.url);
    let attachmentId = url.searchParams.get('attachmentId');
    if (!attachmentId) {
      const body = await request.json().catch(() => ({}));
      attachmentId = body.attachmentId;
    }

    if (!attachmentId) {
      return NextResponse.json({ error: 'attachmentId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch attachment
    const { data: attachment } = await adminClient
      .from('task_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('task_id', taskId)
      .single();

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Delete from storage
    if (attachment.storage_path) {
      await adminClient.storage.from('task-attachments').remove([attachment.storage_path]);
    }

    // Delete record
    await adminClient.from('task_attachments').delete().eq('id', attachmentId);

    // Record activity
    await adminClient.from('task_activities').insert({
      task_id: taskId,
      actor_id: user.id,
      action: 'ATTACHMENT_DELETED',
      details: { file_name: attachment.file_name },
    });

    return NextResponse.json({ success: true, message: 'Attachment deleted successfully.' });
  } catch (error: any) {
    console.error('Delete attachment error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
