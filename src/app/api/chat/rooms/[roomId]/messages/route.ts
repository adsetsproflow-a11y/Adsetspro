import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { getDbPool } from '@/lib/db';

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

    const pool = getDbPool();

    // 2. Strict Security: Verify user is a member of this chat room
    const memberCheck = await pool.query(
      `SELECT id FROM chat_members WHERE room_id = $1 AND user_id = $2 LIMIT 1`,
      [roomId, user.id]
    );

    if (memberCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden: You are not authorized to access this chat room.' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));

    // 3. Query messages with sender profile and attachments using clean direct SQL
    const messagesRes = await pool.query(
      `SELECT 
        m.id, m.room_id, m.sender_id, m.content, m.created_at, m.edited_at,
        json_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'email', p.email,
          'avatar_url', p.avatar_url
        ) as profiles,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', a.id,
              'file_name', a.file_name,
              'file_size', a.file_size,
              'file_type', a.file_type,
              'storage_path', a.storage_path,
              'created_at', a.created_at
            )
          ) FROM chat_attachments a WHERE a.message_id = m.id),
          '[]'::json
        ) as chat_attachments
      FROM chat_messages m
      JOIN profiles p ON p.id = m.sender_id
      WHERE m.room_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2;`,
      [roomId, limit]
    );

    return NextResponse.json({
      success: true,
      messages: messagesRes.rows || [],
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

    const pool = getDbPool();

    // 2. Strict Security: Verify user is a member of this chat room
    const memberCheck = await pool.query(
      `SELECT id FROM chat_members WHERE room_id = $1 AND user_id = $2 LIMIT 1`,
      [roomId, user.id]
    );

    if (memberCheck.rows.length === 0) {
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
          console.warn('Storage upload notice:', uploadError.message);
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

    // 3. Insert into chat_messages via direct SQL
    const msgInsert = await pool.query(
      `INSERT INTO chat_messages (room_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, room_id, sender_id, content, created_at, edited_at;`,
      [roomId, user.id, content.trim() || (attachmentData ? `Shared file: ${attachmentData.fileName}` : '')]
    );

    const message = msgInsert.rows[0];

    // Fetch sender profile
    const profileRes = await pool.query(
      `SELECT id, full_name, email, avatar_url FROM profiles WHERE id = $1`,
      [user.id]
    );
    const profile = profileRes.rows[0] || null;

    // 4. If attachment exists, insert into chat_attachments
    let insertedAttachments: any[] = [];
    if (attachmentData) {
      const attInsert = await pool.query(
        `INSERT INTO chat_attachments (message_id, file_name, file_size, file_type, storage_path, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, file_name, file_size, file_type, storage_path, created_at;`,
        [
          message.id,
          attachmentData.fileName,
          attachmentData.fileSize,
          attachmentData.fileType,
          attachmentData.storagePath,
          user.id,
        ]
      );
      insertedAttachments = attInsert.rows;
    }

    const fullMessage = {
      ...message,
      profiles: profile,
      chat_attachments: insertedAttachments,
    };

    // 5. Dispatch notifications to other room members (excluding sender and super admins)
    try {
      const roomRes = await pool.query(
        `SELECT r.type, r.name, r.company_id, c.slug as company_slug 
         FROM chat_rooms r
         LEFT JOIN companies c ON c.id = r.company_id
         WHERE r.id = $1`,
        [roomId]
      );
      const room = roomRes.rows[0];

      if (room) {
        const membersRes = await pool.query(
          `SELECT cm.user_id 
           FROM chat_members cm
           JOIN profiles p ON p.id = cm.user_id
           WHERE cm.room_id = $1 AND cm.user_id != $2 AND p.is_super_admin IS NOT TRUE`,
          [roomId, user.id]
        );

        if (membersRes.rows.length > 0) {
          const senderName = profile?.full_name || profile?.email || 'A teammate';
          const notifTitle =
            room.type === 'direct'
              ? `New message from ${senderName}`
              : `New message in #${room.name}`;

          const preview =
            content.trim().slice(0, 100) ||
            (attachmentData ? `Sent attachment: ${attachmentData.fileName}` : 'Sent a message');

          for (const m of membersRes.rows) {
            await pool.query(
              `INSERT INTO notifications (user_id, company_id, type, title, body, payload)
               VALUES ($1, $2, 'chat_message', $3, $4, $5)`,
              [
                m.user_id,
                room.company_id,
                notifTitle,
                `${senderName}: ${preview}`,
                JSON.stringify({
                  room_id: roomId,
                  message_id: message.id,
                  sender_id: user.id,
                  company_slug: room.company_slug || '',
                }),
              ]
            );
          }
        }
      }
    } catch (notifErr) {
      console.warn('Chat notification dispatch notice:', notifErr);
    }

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

export async function DELETE(
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

    const pool = getDbPool();

    // 2. Fetch room details and verify user membership
    const roomRes = await pool.query(
      `SELECT r.id, r.company_id, r.type
       FROM chat_rooms r
       JOIN chat_members m ON m.room_id = r.id AND m.user_id = $1
       WHERE r.id = $2`,
      [user.id, roomId]
    );

    if (roomRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this room.' },
        { status: 403 }
      );
    }

    const room = roomRes.rows[0];

    // Check user's role in the company
    const adminCheck = await pool.query(
      `SELECT role FROM company_memberships 
       WHERE user_id = $1 AND company_id = $2 AND status = 'active'`,
      [user.id, room.company_id]
    );
    const role = adminCheck.rows[0]?.role;
    const isCompanyAdmin = role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN';

    const url = new URL(request.url);
    const clearAll = url.searchParams.get('clearAll') === 'true';
    const messageId = url.searchParams.get('messageId');

    // SCENARIO A: Clear entire chat room (Admin, or either user in 1-on-1 direct room)
    if (clearAll) {
      if (!isCompanyAdmin && room.type !== 'direct') {
        return NextResponse.json(
          { error: 'Forbidden: Only Workspace Admins can clear channel chat history.' },
          { status: 403 }
        );
      }

      // 1. Query all attachments for this room to purge physical storage files
      const attRes = await pool.query(
        `SELECT a.storage_path 
         FROM chat_attachments a
         JOIN chat_messages m ON m.id = a.message_id
         WHERE m.room_id = $1`,
        [roomId]
      );

      if (attRes.rows.length > 0) {
        const filePaths = attRes.rows
          .map((r: any) => {
            const path: string = r.storage_path || '';
            if (path.includes('/chat-attachments/')) {
              return path.split('/chat-attachments/')[1];
            }
            return path;
          })
          .filter(Boolean);

        if (filePaths.length > 0) {
          try {
            await adminClient.storage.from('chat-attachments').remove(filePaths);
          } catch (storageErr) {
            console.warn('Chat storage purge notice:', storageErr);
          }
        }
      }

      // 2. Permanently delete all messages from DB for this room (cascades to chat_attachments)
      const deleteRes = await pool.query(
        `DELETE FROM chat_messages WHERE room_id = $1`,
        [roomId]
      );

      return NextResponse.json({
        success: true,
        clearedCount: deleteRes.rowCount,
        message: 'All messages and attachments permanently deleted from DB and storage.',
      });
    }

    // SCENARIO B: Delete a single message (author or Company Admin)
    if (messageId) {
      const msgRes = await pool.query(
        `SELECT id, sender_id, room_id FROM chat_messages WHERE id = $1 AND room_id = $2`,
        [messageId, roomId]
      );

      if (msgRes.rows.length === 0) {
        return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
      }

      const msg = msgRes.rows[0];

      if (msg.sender_id !== user.id && !isCompanyAdmin) {
        return NextResponse.json(
          { error: 'Forbidden: You can only delete your own messages.' },
          { status: 403 }
        );
      }

      // 1. Check for attachments to remove from Supabase storage
      const attRes = await pool.query(
        `SELECT storage_path FROM chat_attachments WHERE message_id = $1`,
        [messageId]
      );

      if (attRes.rows.length > 0) {
        const filePaths = attRes.rows
          .map((r: any) => {
            const path: string = r.storage_path || '';
            if (path.includes('/chat-attachments/')) {
              return path.split('/chat-attachments/')[1];
            }
            return path;
          })
          .filter(Boolean);

        if (filePaths.length > 0) {
          try {
            await adminClient.storage.from('chat-attachments').remove(filePaths);
          } catch (storageErr) {
            console.warn('Single file storage delete notice:', storageErr);
          }
        }
      }

      // 2. Permanently delete message from DB (cascades to chat_attachments)
      await pool.query(`DELETE FROM chat_messages WHERE id = $1`, [messageId]);

      return NextResponse.json({
        success: true,
        messageId,
        message: 'Message permanently deleted from DB and storage.',
      });
    }

    return NextResponse.json(
      { error: 'Bad request: specify messageId or clearAll=true.' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('DELETE /api/chat/rooms/[roomId]/messages error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
