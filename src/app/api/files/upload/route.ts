import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { queryDb } from '@/lib/db';

// Allowed MIME types and extensions (small images, webp, docs, pdf)
const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'webp', 'png', 'jpg', 'jpeg']);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/octet-stream', // Fallback for document binary files
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (lightweight storage)

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const taskId = formData.get('taskId') as string | null;

    if (!file || !taskId) {
      return NextResponse.json(
        { error: 'File and taskId are required for attachment upload.' },
        { status: 400 }
      );
    }

    // 3. Verify task and company membership
    const { data: task, error: taskErr } = await adminClient
      .from('tasks')
      .select('id, company_id, title')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin, full_name')
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
          { error: 'Forbidden: You must be an active member of this workspace to upload attachments.' },
          { status: 403 }
        );
      }
    }

    // 4. Validate file size (<= 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit of 5MB.' },
        { status: 400 }
      );
    }

    // 5. Validate file extension and MIME type
    const parts = file.name.split('.');
    const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `File type .${ext} is not allowed. Only small images (WEBP, PNG, JPG) and documents (PDF, DOC, DOCX) are permitted.` },
        { status: 400 }
      );
    }

    if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `MIME type "${file.type}" is not permitted.` },
        { status: 400 }
      );
    }

    // 6. Sanitize filename and format storage path
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${task.company_id}/${task.id}/${Date.now()}-${safeName}`;

    // Read buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 7. Upload to Supabase Storage private bucket 'task-attachments'
    const { error: uploadError } = await adminClient.storage
      .from('task-attachments')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload file to storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 8. Compute version number
    const { data: latestAttachment } = await adminClient
      .from('task_attachments')
      .select('version')
      .eq('task_id', task.id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latestAttachment?.version || 0) + 1;

    // 9. Insert metadata into task_attachments
    const { data: attachment, error: insertError } = await adminClient
      .from('task_attachments')
      .insert({
        task_id: task.id,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || ext,
        uploaded_by: user.id,
        version: nextVersion,
      })
      .select('*')
      .single();

    if (insertError || !attachment) {
      console.error('Database insert error:', insertError);
      throw insertError || new Error('Failed to record task attachment');
    }

    // Persist real file bytes into PostgreSQL task_file_contents
    try {
      await queryDb(
        `INSERT INTO public.task_file_contents (attachment_id, file_data, mime_type, file_name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (attachment_id) DO UPDATE 
         SET file_data = EXCLUDED.file_data, mime_type = EXCLUDED.mime_type, file_name = EXCLUDED.file_name;`,
        [attachment.id, buffer, file.type || ext || 'application/octet-stream', file.name]
      );
    } catch (dbStoreErr: any) {
      console.warn('[Upload] Failed to persist binary to task_file_contents:', dbStoreErr?.message);
    }

    // 10. Audit log / task_activities
    await adminClient.from('task_activities').insert({
      task_id: task.id,
      actor_id: user.id,
      action: 'ATTACHMENT_ADDED',
      details: {
        file_name: attachment.file_name,
        file_size: attachment.file_size,
        version: attachment.version,
        uploader_name: profile?.full_name || 'Team member',
      },
    });

    // 11. Return metadata — DO NOT EXPOSE RAW STORAGE PATH
    return NextResponse.json({
      success: true,
      file: {
        id: attachment.id,
        taskId: attachment.task_id,
        fileName: attachment.file_name,
        fileSize: attachment.file_size,
        fileType: attachment.file_type,
        version: attachment.version,
        createdAt: attachment.created_at,
        uploaderName: profile?.full_name || 'Team member',
      },
      message: 'File uploaded and secured successfully.',
    });
  } catch (error: any) {
    console.error('POST /api/files/upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
