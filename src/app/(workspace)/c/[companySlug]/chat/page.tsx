import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  Hash,
  Briefcase,
  Users,
  ChevronRight,
  ArrowRight,
  User,
  MessagesSquare,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { getDbPool } from '@/lib/db';
import { syncUserChatRooms } from '@/lib/chat/rooms';
import DirectMessageLink from '@/components/chat/DirectMessageLink';
import CreateGroupChannelModal from '@/components/chat/CreateGroupChannelModal';

interface ChatPageProps {
  params: Promise<{
    companySlug: string;
  }>;
}

export default async function WorkspaceChatHubPage({ params }: ChatPageProps) {
  const { companySlug } = await params;
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Fetch company
  const { data: company } = await adminClient
    .from('companies')
    .select('id, name, slug')
    .eq('slug', companySlug)
    .single();

  if (!company) {
    redirect('/login');
  }

  // 3. Ensure rooms & memberships are synchronized (excludes Super Admin)
  await syncUserChatRooms(user.id, company.id);

  const pool = getDbPool();

  // 4. Fetch user's accessible group channels via robust direct SQL
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

  const groupRooms = groupRoomsRes.rows;
  const companyRooms = groupRooms.filter((r: any) => r.type === 'company' || r.type === 'group');
  const departmentRooms = groupRooms.filter((r: any) => r.type === 'department');

  // 5. Fetch direct rooms with counterpart details (strictly excluding Super Admin)
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

  // 6. Fetch company colleagues (Admin, Dept Head, Employee — excluding Super Admin & self)
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

  // Primary general room
  const primaryRoom = companyRooms[0] || departmentRooms[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Workspace Discussions & Direct Chat
              </h1>
              <p className="text-xs text-zinc-400">
                1-on-1 direct messaging and group discussions between Company Admin, Department Heads, and Employees.
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions: Create Group Channel + Open Primary Room */}
        <div className="flex items-center gap-3">
          <CreateGroupChannelModal companySlug={companySlug} colleagues={colleagues} />

          {primaryRoom && (
            <Link
              href={`/c/${companySlug}/chat/${primaryRoom.id}`}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Open #{primaryRoom.name}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* 1-ON-1 DIRECT MESSAGES SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              1-on-1 Direct Messages (Colleagues)
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            {colleagues.length} {colleagues.length === 1 ? 'colleague' : 'colleagues'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {colleagues.length === 0 ? (
            <p className="text-xs text-zinc-500 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 col-span-full">
              No colleagues available in this workspace yet.
            </p>
          ) : (
            colleagues.map((c: any) => {
              const existingRoom = directRooms.find((dr: any) => dr.other_member?.id === c.id);
              return (
                <DirectMessageLink
                  key={c.id}
                  companySlug={companySlug}
                  targetUserId={c.id}
                  targetUserName={c.full_name || c.email}
                  targetUserRole={c.role}
                  targetUserEmail={c.email}
                  existingRoomId={existingRoom?.id}
                  variant="card"
                />
              );
            })
          )}
        </div>
      </div>

      {/* GROUP CHANNELS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Group Channels
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            {groupRooms.length} {groupRooms.length === 1 ? 'channel' : 'channels'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* COMPANY CHANNELS & CUSTOM GROUP CHANNELS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-zinc-300">
                  Company & Group Channels
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                {companyRooms.length}
              </span>
            </div>

            <div className="space-y-2">
              {companyRooms.length === 0 ? (
                <p className="text-xs text-zinc-500 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                  No group channels created yet.
                </p>
              ) : (
                companyRooms.map((room: any) => (
                  <Link
                    key={room.id}
                    href={`/c/${companySlug}/chat/${room.id}`}
                    className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-indigo-500/50 hover:bg-zinc-900 transition-all flex items-center justify-between group shadow-sm block"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                          #{room.name}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {room.type === 'company' ? 'General' : 'Group'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {room.type === 'company' ? 'All company members' : 'Team group channel'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* DEPARTMENT CHANNELS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-300">
                  Department Channels
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                {departmentRooms.length}
              </span>
            </div>

            <div className="space-y-2">
              {departmentRooms.length === 0 ? (
                <p className="text-xs text-zinc-500 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                  No department channels available for your profile.
                </p>
              ) : (
                departmentRooms.map((room: any) => (
                  <Link
                    key={room.id}
                    href={`/c/${companySlug}/chat/${room.id}`}
                    className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all flex items-center justify-between group shadow-sm block"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                          #{room.name}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Dept
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {room.department_name || 'Department Team & Admin'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
