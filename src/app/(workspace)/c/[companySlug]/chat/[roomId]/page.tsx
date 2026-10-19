import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowLeft,
  Hash,
  Briefcase,
  Users,
  MessageSquare,
  Sparkles,
  User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { getDbPool } from '@/lib/db';
import { syncUserChatRooms } from '@/lib/chat/rooms';
import ChatRoom from '@/components/chat/ChatRoom';
import DirectMessageLink from '@/components/chat/DirectMessageLink';
import CreateGroupChannelModal from '@/components/chat/CreateGroupChannelModal';
import AllChatsButton from '@/components/chat/AllChatsButton';

interface ChatRoomPageProps {
  params: Promise<{
    companySlug: string;
    roomId: string;
  }>;
}

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { companySlug, roomId } = await params;
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const pool = getDbPool();

  // 2. Fetch company
  const compRes = await pool.query(
    `SELECT id, name, slug FROM companies WHERE slug = $1 LIMIT 1`,
    [companySlug]
  );
  const company = compRes.rows[0];

  if (!company) {
    redirect('/login');
  }

  // 3. Sync user chat rooms (excludes Super Admin)
  await syncUserChatRooms(user.id, company.id);

  // 4. Strict Security: Verify user is a member of this chat room
  const memberCheck = await pool.query(
    `SELECT id FROM chat_members WHERE room_id = $1 AND user_id = $2 LIMIT 1`,
    [roomId, user.id]
  );

  if (memberCheck.rows.length === 0) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              403 Forbidden
            </span>
            <h1 className="text-xl font-black text-white">Private Discussion Channel</h1>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              You are not an authorized member of this chat room. Access is restricted to assigned
              team members, department heads, and workspace administrators.
            </p>
          </div>
          <Link
            href={`/c/${companySlug}/chat`}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-200 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Channels</span>
          </Link>
        </div>
      </div>
    );
  }

  // 5. Fetch Room Details
  const roomRes = await pool.query(
    `SELECT r.id, r.company_id, r.department_id, r.type, r.name, r.created_at,
            d.name as department_name
     FROM chat_rooms r
     LEFT JOIN departments d ON d.id = r.department_id
     WHERE r.id = $1`,
    [roomId]
  );
  const room = roomRes.rows[0];

  if (!room) {
    redirect(`/c/${companySlug}/chat`);
  }

  // Check admin role
  const roleRes = await pool.query(
    `SELECT role FROM company_memberships 
     WHERE company_id = $1 AND user_id = $2 AND status = 'active' 
     LIMIT 1`,
    [company.id, user.id]
  );
  const isAdmin = roleRes.rows[0]?.role === 'COMPANY_ADMIN';

  // If direct room, resolve counterpart info (strictly excluding Super Admin)
  let directOtherUser: any = null;
  if (room.type === 'direct') {
    const counterpartRes = await pool.query(
      `SELECT p.id, p.full_name, p.email, p.avatar_url, cm.role
       FROM chat_members om
       JOIN profiles p ON p.id = om.user_id
       LEFT JOIN company_memberships cm ON cm.user_id = om.user_id AND cm.company_id = $2
       WHERE om.room_id = $1 
         AND om.user_id != $3
         AND p.is_super_admin IS NOT TRUE
       LIMIT 1`,
      [roomId, company.id, user.id]
    );

    if (counterpartRes.rows[0]) {
      directOtherUser = {
        id: counterpartRes.rows[0].id,
        fullName: counterpartRes.rows[0].full_name,
        email: counterpartRes.rows[0].email,
        role: counterpartRes.rows[0].role,
        avatarUrl: counterpartRes.rows[0].avatar_url,
      };
    }
  }

  // 6. Fetch initial last 50 messages
  const messagesRes = await pool.query(
    `SELECT 
      m.id, m.room_id, m.sender_id, m.content, m.created_at, m.edited_at,
      json_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'email', p.email,
        'avatar_url', p.avatar_url
      ) as profiles,
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', a.id,
            'file_name', a.file_name,
            'file_size', a.file_size,
            'file_type', a.file_type,
            'storage_path', a.storage_path,
            'created_at', a.created_at
          )
        ) FROM chat_attachments a WHERE a.message_id = m.id),
        '[]'::json
      ) as chat_attachments
    FROM chat_messages m
    JOIN profiles p ON p.id = m.sender_id
    WHERE m.room_id = $1
    ORDER BY m.created_at ASC
    LIMIT 50;`,
    [roomId]
  );
  const initialMessages = messagesRes.rows || [];

  // 7. Fetch user's accessible group channels for sidebar navigation
  const groupRoomsRes = await pool.query(
    `SELECT r.id, r.type, r.name, r.created_at, r.department_id, d.name as department_name
     FROM chat_rooms r
     JOIN chat_members m ON m.room_id = r.id AND m.user_id = $1
     LEFT JOIN departments d ON d.id = r.department_id
     WHERE r.company_id = $2 AND r.type IN ('company', 'department', 'group')
     ORDER BY 
       CASE r.type 
         WHEN 'company' THEN 1 
         WHEN 'group' THEN 2 
         ELSE 3 
       END, 
       r.name ASC;`,
    [user.id, company.id]
  );

  const allGroupRooms = groupRoomsRes.rows;
  const companyRooms = allGroupRooms.filter((r) => r.type === 'company' || r.type === 'group');
  const departmentRooms = allGroupRooms.filter((r) => r.type === 'department');

  // 8. Fetch direct rooms with counterpart user info (excluding Super Admin)
  const directRoomsRes = await pool.query(
    `SELECT 
      r.id, r.type, r.name,
      json_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'email', p.email,
        'role', cm.role
      ) as other_member
     FROM chat_rooms r
     JOIN chat_members m ON m.room_id = r.id AND m.user_id = $1
     JOIN chat_members om ON om.room_id = r.id AND om.user_id != $1
     JOIN profiles p ON p.id = om.user_id
     LEFT JOIN company_memberships cm ON cm.user_id = om.user_id AND cm.company_id = r.company_id
     WHERE r.type = 'direct' 
       AND r.company_id = $2
       AND p.is_super_admin IS NOT TRUE
     ORDER BY r.created_at DESC;`,
    [user.id, company.id]
  );
  const directRooms = directRoomsRes.rows;

  // 9. Fetch all company teammates (Admin, Dept Head, Employee — excluding Super Admin & current user)
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
    [company.id, user.id]
  );
  const colleagues = colleaguesRes.rows;

  // Fetch current user profile
  const profileRes = await pool.query(
    `SELECT full_name, email FROM profiles WHERE id = $1 LIMIT 1`,
    [user.id]
  );
  const profile = profileRes.rows[0];

  const userName = profile?.full_name || profile?.email || 'User';

  return (
    <div className="h-[calc(100vh-7.5rem)] max-w-7xl mx-auto flex flex-col md:flex-row gap-4 overflow-hidden">
      {/* CHANNELS & DIRECT MESSAGES SIDEBAR */}
      <div className="hidden md:flex w-72 bg-zinc-950/80 border border-zinc-800/80 rounded-3xl p-5 flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Workspace Chat
              </h2>
            </div>
            <AllChatsButton href={`/c/${companySlug}/chat`} />
          </div>

          {/* 1-on-1 Direct Messages Section */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400/90 px-2 block flex items-center justify-between">
              <span>Direct Messages (1-on-1)</span>
              <span className="text-zinc-500 font-mono text-[9px]">{colleagues.length}</span>
            </span>

            <div className="space-y-1">
              {colleagues.map((colleague: any) => {
                const existingRoom = directRooms.find(
                  (dr: any) => dr.other_member?.id === colleague.id
                );
                const active = existingRoom ? existingRoom.id === roomId : false;
                return (
                  <DirectMessageLink
                    key={colleague.id}
                    companySlug={companySlug}
                    targetUserId={colleague.id}
                    targetUserName={colleague.full_name || colleague.email}
                    targetUserRole={colleague.role}
                    targetUserEmail={colleague.email}
                    existingRoomId={existingRoom?.id}
                    isActive={active}
                    variant="sidebar"
                  />
                );
              })}
            </div>
          </div>

          {/* Group Channels Section */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/60">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 block">
                Group Channels
              </span>
              <CreateGroupChannelModal
                companySlug={companySlug}
                colleagues={colleagues}
                triggerVariant="icon"
              />
            </div>

            {/* Company Channel */}
            <div className="space-y-1">
              {companyRooms.map((r) => {
                const active = r.id === roomId;
                return (
                  <Link
                    key={r.id}
                    href={`/c/${companySlug}/chat/${r.id}`}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Hash className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">#{r.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Department Channels */}
            {departmentRooms.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-600 px-2 block">
                  Departments
                </span>
                {departmentRooms.map((r) => {
                  const active = r.id === roomId;
                  return (
                    <Link
                      key={r.id}
                      href={`/c/${companySlug}/chat/${r.id}`}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">#{r.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-zinc-800 text-center">
          <p className="text-[11px] text-zinc-500">Live Workspace Chat</p>
        </div>
      </div>

      {/* CHAT ROOM MAIN CLIENT INTERACTION */}
      <div className="flex-1 h-full min-w-0">
        <ChatRoom
          roomId={roomId}
          roomName={room.name}
          roomType={room.type}
          companySlug={companySlug}
          currentUserId={user.id}
          currentUserName={userName}
          initialMessages={(initialMessages as any) || []}
          contextInfo={{
            departmentName: (room.departments as any)?.name,
          }}
          isAdmin={isAdmin}
          directOtherUser={directOtherUser}
        />
      </div>
    </div>
  );
}
