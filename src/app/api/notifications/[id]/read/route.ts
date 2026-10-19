import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();

    // 2. Mark specific notification as read if owned by current user
    const updateRes = await pool.query(
      `UPDATE notifications 
       SET read_at = NOW() 
       WHERE id = $1 AND user_id = $2 
       RETURNING *;`,
      [id, user.id]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: updateRes.rows[0],
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
