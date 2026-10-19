import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
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

    const pool = getDbPool();

    // 2. Mark all unread notifications for this user as read
    const updateRes = await pool.query(
      `UPDATE notifications 
       SET read_at = NOW() 
       WHERE user_id = $1 AND read_at IS NULL 
       RETURNING id;`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      markedCount: updateRes.rowCount,
      message: `Marked ${updateRes.rowCount} notifications as read`,
    });
  } catch (error: any) {
    console.error('Mark all read error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
