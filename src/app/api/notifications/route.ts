import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
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
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // 2. Build notifications query for current user
    let query = adminClient
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply category / read filters
    if (filter === 'unread') {
      query = query.is('read_at', null);
    } else if (filter === 'task') {
      query = query.in('type', [
        'task_assigned',
        'task_approved',
        'task_revision_requested',
        'task_submitted',
        'deadline_warning',
        'overdue_task',
        'TASK_ASSIGNED',
        'TASK_APPROVED',
        'REVISION_REQUIRED',
        'TASK_SUBMITTED',
        'TASK_CANCELLED',
      ]);
    } else if (filter === 'system') {
      query = query.in('type', [
        'company_approved',
        'company_rejected',
        'company_suspended',
        'invitation_sent',
        'invitation_accepted',
      ]);
    } else if (filter === 'chat') {
      query = query.in('type', ['new_comment', 'mention', 'COMMENT_ADDED']);
    }

    // Sort newest first & range
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: notifications, count: totalCount, error } = await query;

    if (error) {
      throw error;
    }

    // 3. Count unread notifications
    const { count: unreadCount } = await adminClient
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null);

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      pagination: {
        total: totalCount || (notifications || []).length,
        page,
        limit,
        totalPages: Math.ceil((totalCount || (notifications || []).length) / limit),
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

    const { error } = await adminClient
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

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

