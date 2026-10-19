'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';

interface ChatChannelCardProps {
  href: string;
  roomName: string;
  badgeText: string;
  badgeType: 'company' | 'department' | 'group';
  subtitle: string;
}

export default function ChatChannelCard({
  href,
  roomName,
  badgeText,
  badgeType,
  subtitle,
}: ChatChannelCardProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const badgeStyles =
    badgeType === 'department'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';

  const hoverBorderStyles =
    badgeType === 'department'
      ? 'hover:border-emerald-500/50'
      : 'hover:border-indigo-500/50';

  const hoverTextStyles =
    badgeType === 'department'
      ? 'group-hover:text-emerald-400'
      : 'group-hover:text-indigo-400';

  return (
    <Link
      href={href}
      onClick={() => setIsNavigating(true)}
      className={`p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 ${hoverBorderStyles} hover:bg-zinc-900 transition-all flex items-center justify-between group shadow-sm block`}
    >
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold text-white ${hoverTextStyles} transition-colors truncate`}>
            #{roomName}
          </span>
          <span
            className={`whitespace-nowrap text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border shrink-0 ${badgeStyles}`}
          >
            {badgeText}
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 truncate">{subtitle}</p>
      </div>

      <div className="ml-3 shrink-0">
        {isNavigating ? (
          <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
        )}
      </div>
    </Link>
  );
}
