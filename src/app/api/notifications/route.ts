import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'all';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const pool = getDbPool();

    // 2. Build where clause
    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [user.id];

    if (filter === 'unread') {
      conditions.push('read_at IS NULL');
    } else if (filter === 'task') {
      conditions.push(`type IN (
        'task_assigned', 'task_approved', 'task_revision_requested', 'task_submitted',
        'deadline_warning', 'overdue_task', 'TASK_ASSIGNED', 'TASK_APPROVED',
        'REVISION_REQUIRED', 'TASK_SUBMITTED', 'TASK_CANCELLED', 'TASK_CREATED'
      )`);
    } else if (filter === 'system') {
      conditions.push(`type IN (
        'company_approved', 'company_rejected', 'company_suspended',
        'invitation_sent', 'invitation_accepted', 'company_registration_pending'
      )`);
    } else if (filter === 'chat') {
      conditions.push(`type IN (
        'new_comment', 'mention', 'COMMENT_ADDED', 'chat_message', 'CHAT_MESSAGE'
      )`);
    }

    const whereSql = conditions.join(' AND ');

    // 3. Count total matching
    const countRes = await pool.query(
      `SELECT count(*)::int as count FROM notifications WHERE ${whereSql}`,
      params
    );
    const totalCount = countRes.rows[0]?.count || 0;

    // 4. Query notifications
    const dataParams = [...params, limit, offset];
    const dataRes = await pool.query(
      `SELECT id, user_id, company_id, type, title, body, payload, read_at, created_at
       FROM notifications
       WHERE ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );
    const notifications = dataRes.rows || [];

    // 5. Count unread notifications
    const unreadRes = await pool.query(
      `SELECT count(*)::int as count FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
      [user.id]
    );
    const unreadCount = unreadRes.rows[0]?.count || 0;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();
    await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [user.id]);

    return NextResponse.json({
      success: true,
      message: 'All notifications cleared successfully',
    });
  } catch (error: any) {
    console.error('Clear all notifications error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
