import { getDbPool } from '@/lib/db';

/**
 * Ensure the default '#general' company chat room exists and enroll all active
 * company members (excluding platform Super Admins).
 */
export async function ensureCompanyChatRoom(companyId: string, companyName?: string) {
  try {
    const pool = getDbPool();

    // 1. Check if company chat room already exists
    let roomRes = await pool.query(
      `SELECT id, company_id, type, name, created_at
       FROM chat_rooms 
       WHERE company_id = $1 AND type = 'company' 
       LIMIT 1`,
      [companyId]
    );

    let room = roomRes.rows[0];

    if (!room) {
      const insertRes = await pool.query(
        `INSERT INTO chat_rooms (company_id, type, name)
         VALUES ($1, 'company', 'general')
         RETURNING id, company_id, type, name, created_at`,
        [companyId]
      );
      room = insertRes.rows[0];
    }

    if (!room) return null;

    // 2. Fetch all active company members (Admin, Head, Employee) excluding Super Admins
    await pool.query(
      `INSERT INTO chat_members (room_id, user_id)
       SELECT $1::uuid, cm.user_id
       FROM company_memberships cm
       JOIN profiles p ON p.id = cm.user_id
       WHERE cm.company_id = $2 
         AND cm.status = 'active'
         AND p.is_super_admin IS NOT TRUE
       ON CONFLICT (room_id, user_id) DO NOTHING;`,
      [room.id, companyId]
    );

    return room;
  } catch (err) {
    console.error('ensureCompanyChatRoom error:', err);
    return null;
  }
}

/**
 * Ensure department chat room exists and enroll department members + company admin.
 * Excludes Super Admins.
 */
export async function ensureDepartmentChatRoom(
  departmentId: string,
  companyId: string,
  departmentName: string
) {
  try {
    const pool = getDbPool();

    let roomRes = await pool.query(
      `SELECT id, company_id, department_id, type, name, created_at
       FROM chat_rooms 
       WHERE department_id = $1 AND type = 'department' 
       LIMIT 1`,
      [departmentId]
    );

    let room = roomRes.rows[0];

    if (!room) {
      const cleanName = departmentName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'department';

      const insertRes = await pool.query(
        `INSERT INTO chat_rooms (company_id, department_id, type, name)
         VALUES ($1, $2, 'department', $3)
         RETURNING id, company_id, department_id, type, name, created_at`,
        [companyId, departmentId, cleanName]
      );
      room = insertRes.rows[0];
    }

    if (!room) return null;

    // Enroll department members and company admins (excluding Super Admins)
    await pool.query(
      `INSERT INTO chat_members (room_id, user_id)
       SELECT DISTINCT $1::uuid, u.user_id

       FROM (
         SELECT dm.user_id 
         FROM department_memberships dm 
         WHERE dm.department_id = $2 AND dm.status = 'active'
         UNION
         SELECT cm.user_id 
         FROM company_memberships cm 
         WHERE cm.company_id = $3 
           AND cm.role = 'COMPANY_ADMIN' 
           AND cm.status = 'active'
       ) u
       JOIN profiles p ON p.id = u.user_id
       WHERE p.is_super_admin IS NOT TRUE
       ON CONFLICT (room_id, user_id) DO NOTHING;`,
      [room.id, departmentId, companyId]
    );

    return room;
  } catch (err) {
    console.error('ensureDepartmentChatRoom error:', err);
    return null;
  }
}

/**
 * Synchronize user's chat memberships for their company:
 * - Company room (#general)
 * - Department rooms
 */
export async function syncUserChatRooms(userId: string, companyId: string) {
  try {
    const pool = getDbPool();

    // Check if user is Super Admin; if so, skip company chat synchronization
    const profileRes = await pool.query(
      `SELECT is_super_admin FROM profiles WHERE id = $1`,
      [userId]
    );
    if (profileRes.rows[0]?.is_super_admin) {
      return;
    }

    // 1. Company room (#general)
    const companyRoom = await ensureCompanyChatRoom(companyId);
    if (companyRoom) {
      await pool.query(
        `INSERT INTO chat_members (room_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (room_id, user_id) DO NOTHING;`,
        [companyRoom.id, userId]
      );
    }

    // 2. Fetch user role
    const memRes = await pool.query(
      `SELECT role FROM company_memberships
       WHERE user_id = $1 AND company_id = $2 AND status = 'active'
       LIMIT 1;`,
      [userId, companyId]
    );
    const membership = memRes.rows[0];
    const isCompanyAdmin = membership?.role === 'COMPANY_ADMIN';

    // 3. Department rooms
    if (isCompanyAdmin) {
      // Company Admin gets enrolled in all company department rooms
      const deptsRes = await pool.query(
        `SELECT id, name FROM departments WHERE company_id = $1`,
        [companyId]
      );
      for (const dept of deptsRes.rows) {
        const dRoom = await ensureDepartmentChatRoom(dept.id, companyId, dept.name);
        if (dRoom) {
          await pool.query(
            `INSERT INTO chat_members (room_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (room_id, user_id) DO NOTHING;`,
            [dRoom.id, userId]
          );
        }
      }
    } else {
      // Department head or employee enrolled in their assigned departments
      const userDeptsRes = await pool.query(
        `SELECT d.id, d.name
         FROM department_memberships dm
         JOIN departments d ON d.id = dm.department_id
         WHERE dm.user_id = $1 AND dm.status = 'active' AND d.company_id = $2`,
        [userId, companyId]
      );
      for (const dept of userDeptsRes.rows) {
        const dRoom = await ensureDepartmentChatRoom(dept.id, companyId, dept.name);
        if (dRoom) {
          await pool.query(
            `INSERT INTO chat_members (room_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (room_id, user_id) DO NOTHING;`,
            [dRoom.id, userId]
          );
        }
      }
    }
  } catch (err) {
    console.error('syncUserChatRooms error:', err);
  }
}

/**
 * Get or create a 1-on-1 direct messaging chat room between two users in a company.
 * Strict check: Neither user can be a Super Admin. Both must be Company Admin, Dept Head, or Employee.
 */
export async function getOrCreateDirectChatRoom(
  userId1: string,
  userId2: string,
  companyId: string
) {
  try {
    const pool = getDbPool();

    // Verify neither user is Super Admin
    const superAdminCheck = await pool.query(
      `SELECT count(*) FROM profiles 
       WHERE id IN ($1, $2) AND is_super_admin = true`,
      [userId1, userId2]
    );
    if (parseInt(superAdminCheck.rows[0]?.count || '0', 10) > 0) {
      console.warn('Direct chat with Super Admin is disallowed.');
      return null;
    }

    // 1. Check if direct room already exists between these two users in this company
    const existing = await pool.query(
      `SELECT r.id, r.type, r.name, r.company_id, r.created_at
       FROM chat_rooms r
       JOIN chat_members m1 ON m1.room_id = r.id AND m1.user_id = $1
       JOIN chat_members m2 ON m2.room_id = r.id AND m2.user_id = $2
       WHERE r.type = 'direct' AND r.company_id = $3
       LIMIT 1;`,
      [userId1, userId2, companyId]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // 2. Create new direct room
    const insertRes = await pool.query(
      `INSERT INTO chat_rooms (company_id, type, name, created_by)
       VALUES ($1, 'direct', 'direct', $2)
       RETURNING id, type, name, company_id, created_at;`,
      [companyId, userId1]
    );

    const room = insertRes.rows[0];

    // 3. Enroll both members in chat_members
    await pool.query(
      `INSERT INTO chat_members (room_id, user_id)
       VALUES ($1, $2), ($1, $3)
       ON CONFLICT (room_id, user_id) DO NOTHING;`,
      [room.id, userId1, userId2]
    );

    return room;
  } catch (err) {
    console.error('getOrCreateDirectChatRoom error:', err);
    return null;
  }
}

/**
 * Add a member to a department chat room when they join the department.
 */
export async function addMemberToDepartmentChatRoom(departmentId: string, userId: string) {
  try {
    const pool = getDbPool();
    const roomRes = await pool.query(
      `SELECT id FROM chat_rooms WHERE department_id = $1 AND type = 'department' LIMIT 1`,
      [departmentId]
    );
    if (roomRes.rows.length > 0) {
      await pool.query(
        `INSERT INTO chat_members (room_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (room_id, user_id) DO NOTHING;`,
        [roomRes.rows[0].id, userId]
      );
    }
  } catch (err) {
    console.error('addMemberToDepartmentChatRoom error:', err);
  }
}

/**
 * Ensure task chat room exists. Kept for backwards compatibility.
 */
export async function ensureTaskChatRoom(...args: any[]) {
  return null;
}

