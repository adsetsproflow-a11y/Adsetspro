import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDbPool } from '@/lib/db';
import { getOrCreateDirectChatRoom } from '@/lib/chat/rooms';

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

    const body = await request.json();
    const { targetUserId, companySlug } = body;

    if (!targetUserId || !companySlug) {
      return NextResponse.json(
        { error: 'Missing targetUserId or companySlug' },
        { status: 400 }
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot initiate a direct chat with yourself.' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // 2. Resolve company
    const compRes = await pool.query(
      `SELECT id FROM companies WHERE slug = $1 LIMIT 1`,
      [companySlug]
    );

    if (compRes.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyId = compRes.rows[0].id;

    // 3. Strict security: Verify both user and targetUserId belong to this company
    const memRes = await pool.query(
      `SELECT user_id, status FROM company_memberships
       WHERE company_id = $1 AND user_id IN ($2, $3) AND status = 'active'`,
      [companyId, user.id, targetUserId]
    );

    if (memRes.rows.length < 2) {
      return NextResponse.json(
        { error: 'Both users must be active members of this workspace.' },
        { status: 403 }
      );
    }

    // Verify neither user is Super Admin
    const saCheck = await pool.query(
      `SELECT id FROM profiles WHERE id IN ($1, $2) AND is_super_admin = true`,
      [user.id, targetUserId]
    );

    if (saCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Super Admin accounts are not part of workspace direct messaging.' },
        { status: 403 }
      );
    }

    // 4. Get or create direct chat room
    const room = await getOrCreateDirectChatRoom(user.id, targetUserId, companyId);

    if (!room) {
      return NextResponse.json(
        { error: 'Failed to create or retrieve direct chat room.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (err: any) {
    console.error('POST /api/chat/direct error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
