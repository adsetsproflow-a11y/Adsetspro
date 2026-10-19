'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Loader2 } from 'lucide-react';

interface DirectMessageLinkProps {
  companySlug: string;
  targetUserId: string;
  targetUserName: string;
  targetUserRole?: string;
  targetUserEmail?: string;
  existingRoomId?: string;
  isActive?: boolean;
  variant?: 'sidebar' | 'card';
}

export default function DirectMessageLink({
  companySlug,
  targetUserId,
  targetUserName,
  targetUserRole,
  targetUserEmail,
  existingRoomId,
  isActive = false,
  variant = 'sidebar',
}: DirectMessageLinkProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const formatRole = (role?: string) => {
    if (role === 'COMPANY_ADMIN') return 'Admin';
    if (role === 'DEPARTMENT_HEAD') return 'Dept Head';
    if (role === 'EMPLOYEE') return 'Employee';
    return role || 'Member';
  };

  const handleCreateRoom = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/chat/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, companySlug }),
      });
      const data = await res.json();
      if (data.success && data.room?.id) {
        router.push(`/c/${companySlug}/chat/${data.room.id}`);
      } else {
        alert(data.error || 'Failed to start direct conversation.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error starting direct chat:', err);
      alert('Network error initiating direct message.');
      setIsLoading(false);
    }
  };

  // CARD VARIANT (For Chat Hub Grid)
  if (variant === 'card') {
    const cardContent = (
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-cyan-500/50 hover:bg-zinc-900 transition-all flex items-center justify-between gap-4 group shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md">
            {targetUserName.charAt(0).toUpperCase()}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                {targetUserName}
              </span>
              {targetUserRole && (
                <span className="shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {formatRole(targetUserRole)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 truncate font-mono">
              {targetUserEmail}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-3.5 py-2 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 group-hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </>
          )}
        </div>
      </div>
    );

    if (existingRoomId) {
      return (
        <Link href={`/c/${companySlug}/chat/${existingRoomId}`} className="block">
          {cardContent}
        </Link>
      );
    }

    return (
      <div onClick={handleCreateRoom} className="cursor-pointer block">
        {cardContent}
      </div>
    );
  }

  // SIDEBAR VARIANT
  const sidebarContent = (
    <div
      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
        isActive
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-[10px] text-cyan-300 shrink-0 font-bold">
            {targetUserName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="truncate">{targetUserName}</span>
      </div>

      {targetUserRole && (
        <span className="whitespace-nowrap text-[9px] font-mono uppercase text-zinc-500 shrink-0 ml-1">
          {formatRole(targetUserRole)}
        </span>
      )}
    </div>
  );

  if (existingRoomId) {
    return (
      <Link href={`/c/${companySlug}/chat/${existingRoomId}`} className="block">
        {sidebarContent}
      </Link>
    );
  }

  return (
    <div onClick={handleCreateRoom} className="cursor-pointer block">
      {sidebarContent}
    </div>
  );
}
