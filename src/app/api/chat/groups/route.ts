import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDbPool } from '@/lib/db';

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
    const { companySlug, name, isAllMembers = true, memberIds = [] } = body;

    if (!companySlug || !name || !name.trim()) {
      return NextResponse.json(
        { error: 'Channel name and companySlug are required.' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // 2. Resolve company & verify caller membership
    const compRes = await pool.query(
      `SELECT c.id, c.name, cm.role
       FROM companies c
       JOIN company_memberships cm ON cm.company_id = c.id
       WHERE c.slug = $1 AND cm.user_id = $2 AND cm.status = 'active'`,
      [companySlug, user.id]
    );

    if (compRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden: You are not an active member of this workspace.' },
        { status: 403 }
      );
    }

    const companyId = compRes.rows[0].id;

    // 3. Clean channel name
    const cleanName = name
      .trim()
      .toLowerCase()
      .replace(/^#+/, '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!cleanName) {
      return NextResponse.json(
        { error: 'Invalid channel name. Use letters, numbers, and dashes.' },
        { status: 400 }
      );
    }

    // 4. Check if channel name already exists in this company
    const existing = await pool.query(
      `SELECT id, name, type FROM chat_rooms WHERE company_id = $1 AND name = $2 LIMIT 1`,
      [companyId, cleanName]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: `A channel named #${cleanName} already exists in this workspace.` },
        { status: 400 }
      );
    }

    // 5. Create the group channel
    const insertRes = await pool.query(
      `INSERT INTO chat_rooms (company_id, type, name, created_by)
       VALUES ($1, 'group', $2, $3)
       RETURNING id, company_id, type, name, created_at;`,
      [companyId, cleanName, user.id]
    );

    const room = insertRes.rows[0];

    // 6. Enroll members
    if (isAllMembers || !memberIds || memberIds.length === 0) {
      // Enroll all active company members (excluding Super Admin)
      await pool.query(
        `INSERT INTO chat_members (room_id, user_id)
         SELECT $1::uuid, cm.user_id
         FROM company_memberships cm
         JOIN profiles p ON p.id = cm.user_id
         WHERE cm.company_id = $2 AND cm.status = 'active' AND p.is_super_admin IS NOT TRUE
         ON CONFLICT (room_id, user_id) DO NOTHING;`,
        [room.id, companyId]
      );
    } else {
      const uniqueIds = Array.from(new Set([user.id, ...memberIds]));
      await pool.query(
        `INSERT INTO chat_members (room_id, user_id)
         SELECT $1::uuid, p.id
         FROM profiles p
         JOIN company_memberships cm ON cm.user_id = p.id AND cm.company_id = $2 AND cm.status = 'active'
         WHERE p.id = ANY($3::uuid[])
           AND p.is_super_admin IS NOT TRUE
         ON CONFLICT (room_id, user_id) DO NOTHING;`,
        [room.id, companyId, uniqueIds]
      );
    }

    return NextResponse.json({
      success: true,
      room,
      message: `Group channel #${cleanName} created and applied across team members.`,
    });
  } catch (err: any) {
    console.error('POST /api/chat/groups error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
