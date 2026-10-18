import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  Hash,
  Briefcase,
  CheckSquare,
  Users,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { syncUserChatRooms } from '@/lib/chat/rooms';

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

  // 3. Ensure rooms & memberships are synchronized
  await syncUserChatRooms(user.id, company.id);

  // 4. Fetch user's accessible channels
  const { data: memberships } = await adminClient
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
        departments (name),
        tasks (title, status, priority)
      )
    `)
    .eq('user_id', user.id)
    .eq('chat_rooms.company_id', company.id);

  const rooms = (memberships || []).map((m: any) => m.chat_rooms);
  const companyRooms = rooms.filter((r) => r.type === 'company');
  const departmentRooms = rooms.filter((r) => r.type === 'department');
  const taskRooms = rooms.filter((r) => r.type === 'task');

  // If there is a primary company room, redirect on desktop or render hub
  const primaryRoom = companyRooms[0] || rooms[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Workspace Discussions
              </h1>
              <p className="text-xs text-zinc-400">
                Realtime collaboration across company channels, department rooms, and task threads.
              </p>
            </div>
          </div>
        </div>

        {primaryRoom && (
          <Link
            href={`/c/${companySlug}/chat/${primaryRoom.id}`}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
          >
            <span>Open #{primaryRoom.name}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Grid of Channels categorized */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COMPANY CHANNELS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Company General
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              {companyRooms.length}
            </span>
          </div>

          <div className="space-y-2">
            {companyRooms.length === 0 ? (
              <p className="text-xs text-zinc-500 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                No company channels created yet.
              </p>
            ) : (
              companyRooms.map((room) => (
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
                    </div>
                    <p className="text-[11px] text-zinc-400">All company members</p>
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Department Rooms
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              {departmentRooms.length}
            </span>
          </div>

          <div className="space-y-2">
            {departmentRooms.length === 0 ? (
              <p className="text-xs text-zinc-500 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                No department rooms found for your profile.
              </p>
            ) : (
              departmentRooms.map((room) => (
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
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {room.departments?.name || 'Department Team'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* TASK THREADS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Task Discussion Threads
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              {taskRooms.length}
            </span>
          </div>

          <div className="space-y-2">
            {taskRooms.length === 0 ? (
              <p className="text-xs text-zinc-500 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                No active task discussions assigned to you.
              </p>
            ) : (
              taskRooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/c/${companySlug}/chat/${room.id}`}
                  className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900 transition-all flex items-center justify-between group shadow-sm block"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                        #{room.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {room.tasks?.title || 'Deliverable Task'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors shrink-0" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
