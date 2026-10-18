import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
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
      });
    }

    // 3. Ensure rooms & memberships are synced
    await syncUserChatRooms(user.id, companyId);

    // 4. Query chat_members for this user and company
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

    // 5. Categorize into Company, Department, and Task rooms
    const companyRooms = rooms.filter((r) => r.type === 'company');
    const departmentRooms = rooms.filter((r) => r.type === 'department');
    const taskRooms = rooms.filter((r) => r.type === 'task');

    return NextResponse.json({
      success: true,
      rooms,
      companyRooms,
      departmentRooms,
      taskRooms,
    });
  } catch (err: any) {
    console.error('GET /api/chat/rooms error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
