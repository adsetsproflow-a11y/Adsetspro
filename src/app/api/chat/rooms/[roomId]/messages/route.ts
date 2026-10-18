import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Strict Security: Verify user is a member of this chat room
    const { data: member } = await adminClient
      .from('chat_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json(
        { error: 'Forbidden: You are not authorized to access this chat room.' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));

    // 3. Query messages with sender profile and attachments
    const { data: messages, error } = await adminClient
      .from('chat_messages')
      .select(`
        id,
        room_id,
        sender_id,
        content,
        created_at,
        edited_at,
        profiles (
          id,
          full_name,
          email,
          avatar_url
        ),
        chat_attachments (
          id,
          file_name,
          file_size,
          file_type,
          storage_path,
          created_at
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Fetch messages error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
    });
  } catch (err: any) {
    console.error('GET /api/chat/rooms/[roomId]/messages error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Strict Security: Verify user is a member of this chat room
    const { data: member } = await adminClient
      .from('chat_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a member of this chat room.' },
        { status: 403 }
      );
    }

    let content = '';
    let attachmentData: {
      storagePath: string;
      fileName: string;
      fileSize: number;
      fileType: string;
    } | null = null;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      content = (formData.get('content') as string) || '';
      const file = formData.get('file') as File | null;

      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const safeName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storagePath = `${roomId}/${safeName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to chat-attachments bucket
        const { error: uploadError } = await adminClient.storage
          .from('chat-attachments')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          console.warn('Storage upload warning, using direct metadata:', uploadError.message);
        }

        const { data: publicUrlData } = adminClient.storage
          .from('chat-attachments')
          .getPublicUrl(storagePath);

        attachmentData = {
          storagePath: publicUrlData?.publicUrl || storagePath,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
        };
      }
    } else {
      const body = await request.json();
      content = body.content || '';
      if (body.attachment) {
        attachmentData = {
          storagePath: body.attachment.storagePath || '',
          fileName: body.attachment.fileName || 'file',
          fileSize: body.attachment.fileSize || 0,
          fileType: body.attachment.fileType || 'application/octet-stream',
        };
      }
    }

    if (!content.trim() && !attachmentData) {
      return NextResponse.json(
        { error: 'Message cannot be empty without an attachment.' },
        { status: 400 }
      );
    }

    // 3. Insert into chat_messages
    const { data: message, error: msgError } = await adminClient
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        content: content.trim() || (attachmentData ? `Shared attachment: ${attachmentData.fileName}` : ''),
      })
      .select(`
        id,
        room_id,
        sender_id,
        content,
        created_at,
        edited_at,
        profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (msgError || !message) {
      console.error('Insert message error:', msgError);
      throw msgError;
    }

    // 4. If attachment exists, insert into chat_attachments
    let insertedAttachment: any = null;
    if (attachmentData) {
      const { data: att, error: attError } = await adminClient
        .from('chat_attachments')
        .insert({
          message_id: message.id,
          storage_path: attachmentData.storagePath,
          file_name: attachmentData.fileName,
          file_size: attachmentData.fileSize,
          file_type: attachmentData.fileType,
          uploaded_by: user.id,
        })
        .select('*')
        .single();

      if (!attError) {
        insertedAttachment = att;
      }
    }

    const fullMessage = {
      ...message,
      chat_attachments: insertedAttachment ? [insertedAttachment] : [],
    };

    return NextResponse.json({
      success: true,
      message: fullMessage,
    });
  } catch (err: any) {
    console.error('POST /api/chat/rooms/[roomId]/messages error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
