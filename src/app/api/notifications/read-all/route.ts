import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Mark all unread notifications for this user as read
    const { data: updatedList, error } = await adminClient
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)
      .select('id');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      markedCount: updatedList?.length || 0,
      message: `Marked ${updatedList?.length || 0} notifications as read`,
    });
  } catch (error: any) {
    console.error('Mark all read error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
