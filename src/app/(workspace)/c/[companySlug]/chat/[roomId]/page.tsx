import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowLeft,
  Hash,
  Briefcase,
  CheckSquare,
  Users,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { syncUserChatRooms } from '@/lib/chat/rooms';
import ChatRoom from '@/components/chat/ChatRoom';

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

  // 2. Fetch company
  const { data: company } = await adminClient
    .from('companies')
    .select('id, name, slug')
    .eq('slug', companySlug)
    .single();

  if (!company) {
    redirect('/login');
  }

  // 3. Sync user chat rooms
  await syncUserChatRooms(user.id, company.id);

  // 4. Strict Security: Verify user is a member of this chat room (server-side)
  const { data: membership } = await adminClient
    .from('chat_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
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
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-200 inline-flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Channels</span>
          </Link>
        </div>
      </div>
    );
  }

  // 5. Fetch Room Details
  const { data: room } = await adminClient
    .from('chat_rooms')
    .select(`
      id,
      company_id,
      department_id,
      task_id,
      type,
      name,
      created_at,
      departments (id, name),
      tasks (id, title, status)
    `)
    .eq('id', roomId)
    .single();

  if (!room) {
    redirect(`/c/${companySlug}/chat`);
  }

  // 6. Fetch initial last 50 messages
  const { data: initialMessages } = await adminClient
    .from('chat_messages')
    .select(`
      id,
      room_id,
      sender_id,
      content,
      created_at,
      edited_at,
      profiles (
        id,
        full_name,
        email,
        avatar_url
      ),
      chat_attachments (
        id,
        file_name,
        file_size,
        file_type,
        storage_path,
        created_at
      )
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(50);

  // 7. Fetch user's accessible channels for sidebar navigation
  const { data: userMemberships } = await adminClient
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
        departments (name),
        tasks (title)
      )
    `)
    .eq('user_id', user.id)
    .eq('chat_rooms.company_id', company.id);

  const allRooms = (userMemberships || []).map((m: any) => m.chat_rooms);
  const companyRooms = allRooms.filter((r) => r.type === 'company');
  const departmentRooms = allRooms.filter((r) => r.type === 'department');
  const taskRooms = allRooms.filter((r) => r.type === 'task');

  // Fetch user profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const userName = profile?.full_name || profile?.email || 'User';

  return (
    <div className="h-[calc(100vh-7.5rem)] max-w-7xl mx-auto flex flex-col md:flex-row gap-4 overflow-hidden">
      {/* CHANNELS SIDEBAR (Hidden on mobile when in room, visible on desktop) */}
      <div className="hidden md:flex w-72 bg-zinc-950/80 border border-zinc-800/80 rounded-3xl p-5 flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Workspace Chat
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              {allRooms.length} rooms
            </span>
          </div>

          {/* Company Channel */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 px-2 block">
              Company General
            </span>
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
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 px-2 block">
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
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
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

          {/* Task Channels */}
          {taskRooms.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 px-2 block">
                Task Threads
              </span>
              {taskRooms.map((r) => {
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
                      <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">#{r.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-zinc-800 text-center">
          <p className="text-[11px] text-zinc-500">Live chat encrypted & audited</p>
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
            taskTitle: (room.tasks as any)?.title,
            departmentName: (room.departments as any)?.name,
          }}
        />
      </div>
    </div>
  );
}
