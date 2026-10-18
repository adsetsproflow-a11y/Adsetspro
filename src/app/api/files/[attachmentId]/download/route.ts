import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(
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
        file_size,
        file_type,
        version,
        uploaded_by,
        tasks (
          id,
          company_id,
          department_id
        )
      `)
      .eq('id', attachmentId)
      .single();

    if (attachErr || !attachment) {
      return NextResponse.json({ error: 'File attachment not found.' }, { status: 404 });
    }

    const task = attachment.tasks as any;
    if (!task) {
      return NextResponse.json({ error: 'Associated task not found.' }, { status: 404 });
    }

    // 3. Strict Security: Verify user has access to this task's company
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
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
          { error: 'Forbidden: You do not have permission to access files from this workspace.' },
          { status: 403 }
        );
      }
    }

    // 4. Generate 60-second signed URL using admin client
    const { data: signedData, error: signError } = await adminClient.storage
      .from('task-attachments')
      .createSignedUrl(attachment.storage_path, 60, {
        download: attachment.file_name,
      });

    if (signError || !signedData?.signedUrl) {
      console.error('Failed to generate signed download URL:', signError);
      return NextResponse.json(
        { error: 'Failed to generate secure download link.' },
        { status: 500 }
      );
    }

    // 5. Return signed URL only — DO NOT expose raw storage path
    return NextResponse.json({
      success: true,
      downloadUrl: signedData.signedUrl,
      fileName: attachment.file_name,
      expiresInSeconds: 60,
    });
  } catch (error: any) {
    console.error('GET /api/files/[attachmentId]/download error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
