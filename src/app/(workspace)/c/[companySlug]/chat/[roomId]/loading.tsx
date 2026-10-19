import React from 'react';
import { Loader2, MessageSquare } from 'lucide-react';

export default function ChatRoomLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-zinc-950/80 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md animate-pulse">
      {/* Header Skeleton */}
      <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-16 h-8 rounded-xl bg-zinc-900 border border-zinc-800" />
          <div className="w-9 h-9 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-indigo-400 opacity-60" />
          </div>
          <div className="space-y-1.5">
            <div className="w-32 h-4 rounded bg-zinc-850" />
            <div className="w-48 h-3 rounded bg-zinc-900" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Loading Chat...</span>
          </div>
        </div>
      </div>

      {/* Messages Feed Skeleton */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="flex items-start gap-3 max-w-md">
          <div className="w-8 h-8 rounded-full bg-zinc-850 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="w-24 h-3 rounded bg-zinc-850" />
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
              <div className="w-44 h-3 rounded bg-zinc-850" />
              <div className="w-32 h-3 rounded bg-zinc-850" />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 max-w-md ml-auto flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-indigo-650/40 shrink-0" />
          <div className="space-y-1.5 flex-1 flex flex-col items-end">
            <div className="w-20 h-3 rounded bg-zinc-850" />
            <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 space-y-1">
              <div className="w-48 h-3 rounded bg-indigo-500/30" />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 max-w-md">
          <div className="w-8 h-8 rounded-full bg-zinc-850 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="w-28 h-3 rounded bg-zinc-850" />
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
              <div className="w-56 h-3 rounded bg-zinc-850" />
              <div className="w-36 h-3 rounded bg-zinc-850" />
            </div>
          </div>
        </div>
      </div>

      {/* Input Bar Skeleton */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/50 flex items-center gap-3">
        <div className="flex-1 h-11 rounded-2xl bg-zinc-900 border border-zinc-800" />
        <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
        </div>
      </div>
    </div>
  );
}
