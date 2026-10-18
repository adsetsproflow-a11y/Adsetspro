import { adminClient } from '@/lib/supabase/admin';

/**
 * Ensure the default '#general' company chat room exists and enroll all active members.
 */
export async function ensureCompanyChatRoom(companyId: string, companyName?: string) {
  try {
    // 1. Check if company chat room already exists
    let { data: room, error: roomError } = await adminClient
      .from('chat_rooms')
      .select('*')
      .eq('company_id', companyId)
      .eq('type', 'company')
      .maybeSingle();

    if (roomError) {
      console.error('Error finding company room:', roomError);
    }

    if (!room) {
      const roomName = 'general';
      const { data: newRoom, error: createError } = await adminClient
        .from('chat_rooms')
        .insert({
          company_id: companyId,
          type: 'company',
          name: roomName,
        })
        .select('*')
        .single();

      if (createError) {
        console.error('Failed to create company room:', createError);
        return null;
      }
      room = newRoom;
    }

    if (!room) return null;

    // 2. Fetch all active company members and enroll them
    const { data: members } = await adminClient
      .from('company_memberships')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (members && members.length > 0) {
      const chatMemberRows = members.map((m) => ({
        room_id: room.id,
        user_id: m.user_id,
      }));

      await adminClient
        .from('chat_members')
        .upsert(chatMemberRows, { onConflict: 'room_id,user_id', ignoreDuplicates: true });
    }

    return room;
  } catch (err) {
    console.error('ensureCompanyChatRoom error:', err);
    return null;
  }
}

/**
 * Ensure department chat room exists and enroll department members + admins.
 */
export async function ensureDepartmentChatRoom(
  departmentId: string,
  companyId: string,
  departmentName: string
) {
  try {
    let { data: room } = await adminClient
      .from('chat_rooms')
      .select('*')
      .eq('department_id', departmentId)
      .eq('type', 'department')
      .maybeSingle();

    if (!room) {
      const cleanName = departmentName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: newRoom, error: createError } = await adminClient
        .from('chat_rooms')
        .insert({
          company_id: companyId,
          department_id: departmentId,
          type: 'department',
          name: cleanName || 'department',
        })
        .select('*')
        .single();

      if (createError) {
        console.error('Failed to create department room:', createError);
        return null;
      }
      room = newRoom;
    }

    if (!room) return null;

    // Fetch department members from department_memberships
    const { data: deptMembers } = await adminClient
      .from('department_memberships')
      .select('user_id')
      .eq('department_id', departmentId);

    // Also fetch company admins
    const { data: admins } = await adminClient
      .from('company_memberships')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('role', 'COMPANY_ADMIN')
      .eq('status', 'active');

    const userIdsToEnroll = new Set<string>();
    (deptMembers || []).forEach((m) => userIdsToEnroll.add(m.user_id));
    (admins || []).forEach((a) => userIdsToEnroll.add(a.user_id));

    if (userIdsToEnroll.size > 0) {
      const rows = Array.from(userIdsToEnroll).map((uid) => ({
        room_id: room.id,
        user_id: uid,
      }));

      await adminClient
        .from('chat_members')
        .upsert(rows, { onConflict: 'room_id,user_id', ignoreDuplicates: true });
    }

    return room;
  } catch (err) {
    console.error('ensureDepartmentChatRoom error:', err);
    return null;
  }
}

/**
 * Ensure task chat room exists and enroll assignee + reviewer + creator.
 */
export async function ensureTaskChatRoom(
  taskId: string,
  companyId: string,
  taskTitle: string,
  assigneeId?: string | null,
  reviewerId?: string | null,
  createdById?: string | null
) {
  try {
    let { data: room } = await adminClient
      .from('chat_rooms')
      .select('*')
      .eq('task_id', taskId)
      .eq('type', 'task')
      .maybeSingle();

    if (!room) {
      const cleanName = `task-${taskTitle
        .slice(0, 24)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')}`;

      const { data: newRoom, error: createError } = await adminClient
        .from('chat_rooms')
        .insert({
          company_id: companyId,
          task_id: taskId,
          type: 'task',
          name: cleanName || `task-${taskId.slice(0, 8)}`,
          created_by: createdById || null,
        })
        .select('*')
        .single();

      if (createError) {
        console.error('Failed to create task room:', createError);
        return null;
      }
      room = newRoom;
    }

    if (!room) return null;

    const userIds = new Set<string>();
    if (assigneeId) userIds.add(assigneeId);
    if (reviewerId) userIds.add(reviewerId);
    if (createdById) userIds.add(createdById);

    if (userIds.size > 0) {
      const rows = Array.from(userIds).map((uid) => ({
        room_id: room.id,
        user_id: uid,
      }));

      await adminClient
        .from('chat_members')
        .upsert(rows, { onConflict: 'room_id,user_id', ignoreDuplicates: true });
    }

    return room;
  } catch (err) {
    console.error('ensureTaskChatRoom error:', err);
    return null;
  }
}

/**
 * Add a member to a department chat room when they join the department.
 */
export async function addMemberToDepartmentChatRoom(departmentId: string, userId: string) {
  try {
    const { data: room } = await adminClient
      .from('chat_rooms')
      .select('*')
      .eq('department_id', departmentId)
      .eq('type', 'department')
      .maybeSingle();

    if (room) {
      await adminClient
        .from('chat_members')
        .upsert({ room_id: room.id, user_id: userId }, { onConflict: 'room_id,user_id', ignoreDuplicates: true });
    }
  } catch (err) {
    console.error('addMemberToDepartmentChatRoom error:', err);
  }
}

/**
 * Synchronize user's chat memberships for their company:
 * - Company room
 * - Department rooms
 * - Task rooms (where user is assignee, reviewer, or creator)
 */
export async function syncUserChatRooms(userId: string, companyId: string) {
  try {
    // 1. Company room
    await ensureCompanyChatRoom(companyId);

    // Ensure user is in company room
    const { data: companyRoom } = await adminClient
      .from('chat_rooms')
      .select('id')
      .eq('company_id', companyId)
      .eq('type', 'company')
      .maybeSingle();

    if (companyRoom) {
      await adminClient
        .from('chat_members')
        .upsert({ room_id: companyRoom.id, user_id: userId }, { onConflict: 'room_id,user_id', ignoreDuplicates: true });
    }

    // 2. Fetch user role
    const { data: membership } = await adminClient
      .from('company_memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .maybeSingle();

    const isCompanyAdmin = membership?.role === 'COMPANY_ADMIN' || (membership?.role as string) === 'SUPER_ADMIN';

    // 3. Department rooms
    if (isCompanyAdmin) {
      // Admin gets enrolled in all company department rooms
      const { data: allDepts } = await adminClient
        .from('departments')
        .select('id, name')
        .eq('company_id', companyId);

      for (const dept of allDepts || []) {
        const dRoom = await ensureDepartmentChatRoom(dept.id, companyId, dept.name);
        if (dRoom) {
          await adminClient
            .from('chat_members')
            .upsert({ room_id: dRoom.id, user_id: userId }, { onConflict: 'room_id,user_id', ignoreDuplicates: true });
        }
      }
    } else {
      // Find user's departments from department_memberships
      const { data: userDepts } = await adminClient
        .from('department_memberships')
        .select('department_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (userDepts && userDepts.length > 0) {
        const deptIds = userDepts.map((d) => d.department_id);
        const { data: depts } = await adminClient
          .from('departments')
          .select('id, name')
          .in('id', deptIds)
          .eq('company_id', companyId);

        for (const dept of depts || []) {
          const dRoom = await ensureDepartmentChatRoom(dept.id, companyId, dept.name);
          if (dRoom) {
            await adminClient
              .from('chat_members')
              .upsert({ room_id: dRoom.id, user_id: userId }, { onConflict: 'room_id,user_id', ignoreDuplicates: true });
          }
        }
      }
    }

    // 4. Task rooms for tasks user is assigned to or reviewing
    const { data: userAssignments } = await adminClient
      .from('task_assignments')
      .select('task_id')
      .eq('employee_id', userId)
      .eq('is_current', true);

    const assignedIds = (userAssignments || []).map((a) => a.task_id);

    let taskQuery = adminClient
      .from('tasks')
      .select('id, title, reviewer_id, created_by')
      .eq('company_id', companyId);

    if (assignedIds.length > 0) {
      taskQuery = taskQuery.or(`reviewer_id.eq.${userId},created_by.eq.${userId},id.in.(${assignedIds.join(',')})`);
    } else {
      taskQuery = taskQuery.or(`reviewer_id.eq.${userId},created_by.eq.${userId}`);
    }

    const { data: userTasks } = await taskQuery.limit(30);

    for (const t of userTasks || []) {
      await ensureTaskChatRoom(t.id, companyId, t.title, null, t.reviewer_id, t.created_by);
    }
  } catch (err) {
    console.error('syncUserChatRooms error:', err);
  }
}
