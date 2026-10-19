import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { getDbPool } from '@/lib/db';
import { syncUserChatRooms } from '@/lib/chat/rooms';

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
    const companySlug = url.searchParams.get('companySlug');

    // 2. Resolve company
    let companyId: string | null = null;
    if (companySlug) {
      const { data: comp } = await adminClient
        .from('companies')
        .select('id')
        .eq('slug', companySlug)
        .maybeSingle();

      if (comp) {
        companyId = comp.id;
      }
    }

    if (!companyId) {
      // Find user's active membership
      const { data: mem } = await adminClient
        .from('company_memberships')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (mem) {
        companyId = mem.company_id;
      }
    }

    if (!companyId) {
      return NextResponse.json({
        success: true,
        rooms: [],
        companyRooms: [],
        departmentRooms: [],
        taskRooms: [],
        directRooms: [],
        companyMembers: [],
      });
    }

    // 3. Ensure rooms & memberships are synced
    await syncUserChatRooms(user.id, companyId);

    // 4. Query chat_members for standard rooms (company, department, task)
    const { data: memberships, error } = await adminClient
      .from('chat_members')
      .select(`
        room_id,
        chat_rooms!inner (
          id,
          company_id,
          department_id,
          task_id,
          type,
          name,
          created_at,
          departments (id, name),
          tasks (id, title, status, priority)
        )
      `)
      .eq('user_id', user.id)
      .eq('chat_rooms.company_id', companyId);

    if (error) {
      console.error('Fetch user rooms error:', error);
      throw error;
    }

    const rooms = (memberships || []).map((m: any) => {
      const room = m.chat_rooms;
      return {
        id: room.id,
        company_id: room.company_id,
        department_id: room.department_id,
        task_id: room.task_id,
        type: room.type,
        name: room.name,
        created_at: room.created_at,
        department: room.departments,
        task: room.tasks,
      };
    });

    const companyRooms = rooms.filter((r) => r.type === 'company');
    const departmentRooms = rooms.filter((r) => r.type === 'department');
    const taskRooms = rooms.filter((r) => r.type === 'task');

    // 5. Query direct 1-on-1 rooms with counterpart details
    const pool = getDbPool();
    const directRes = await pool.query(
      `SELECT 
        r.id, r.type, r.name, r.created_at, r.company_id,
        json_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'email', p.email,
          'avatar_url', p.avatar_url,
          'role', cm.role
        ) as other_member
      FROM chat_rooms r
      JOIN chat_members m ON m.room_id = r.id AND m.user_id = $1
      JOIN chat_members om ON om.room_id = r.id AND om.user_id != $1
      JOIN profiles p ON p.id = om.user_id
      LEFT JOIN company_memberships cm ON cm.user_id = om.user_id AND cm.company_id = r.company_id
      WHERE r.type = 'direct' AND r.company_id = $2 AND p.is_super_admin IS NOT TRUE
      ORDER BY r.created_at DESC;`,
      [user.id, companyId]
    );
    const directRooms = directRes.rows;

    // 6. Query all active colleagues in this company for direct messaging directory (Admin, Dept Head, Employee)
    const colleaguesRes = await pool.query(
      `SELECT 
        p.id, p.full_name, p.email, p.avatar_url, cm.role
      FROM company_memberships cm
      JOIN profiles p ON p.id = cm.user_id
      WHERE cm.company_id = $1 
        AND cm.status = 'active' 
        AND cm.user_id != $2
        AND p.is_super_admin IS NOT TRUE
        AND cm.role IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD', 'EMPLOYEE')

      ORDER BY 
        CASE cm.role 
          WHEN 'COMPANY_ADMIN' THEN 1 
          WHEN 'DEPARTMENT_HEAD' THEN 2 
          ELSE 3 
        END, 
        p.full_name ASC;`,
      [companyId, user.id]
    );
    const companyMembers = colleaguesRes.rows;

    return NextResponse.json({
      success: true,
      rooms,
      companyRooms,
      departmentRooms,
      taskRooms,
      directRooms,
      companyMembers,
    });
  } catch (err: any) {
    console.error('GET /api/chat/rooms error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
