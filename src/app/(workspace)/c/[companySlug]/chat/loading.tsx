import React from 'react';
import { Loader2, MessageSquare, Users, Hash } from 'lucide-react';

export default function ChatHubLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="w-56 h-5 rounded bg-zinc-800" />
            <div className="w-80 h-3.5 rounded bg-zinc-850" />
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Loading Discussions...</span>
        </div>
      </div>

      {/* 1-on-1 Messages Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="w-48 h-4 rounded bg-zinc-800" />
          <div className="w-16 h-4 rounded bg-zinc-900" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 flex-1">
                <div className="w-11 h-11 rounded-full bg-zinc-800 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-4 rounded bg-zinc-800" />
                  <div className="w-40 h-3 rounded bg-zinc-850" />
                </div>
              </div>
              <div className="w-16 h-8 rounded-xl bg-zinc-800/60" />
            </div>
          ))}
        </div>
      </div>

      {/* Group Channels Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="w-40 h-4 rounded bg-zinc-800" />
          <div className="w-16 h-4 rounded bg-zinc-900" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="w-32 h-4 rounded bg-zinc-800" />
            <div className="w-full h-14 rounded-xl bg-zinc-850/60" />
          </div>
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="w-32 h-4 rounded bg-zinc-800" />
            <div className="w-full h-14 rounded-xl bg-zinc-850/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
