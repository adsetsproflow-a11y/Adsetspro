import React from 'react';

export default function WorkspaceLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-zinc-800/80 rounded-full w-32" />
          <div className="h-7 bg-zinc-800 rounded-xl w-64" />
          <div className="h-3 bg-zinc-800/50 rounded-lg w-96" />
        </div>
        <div className="h-9 bg-zinc-800 rounded-xl w-36" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 bg-zinc-800/80 rounded w-20" />
              <div className="w-8 h-8 rounded-xl bg-zinc-800/80" />
            </div>
            <div className="h-7 bg-zinc-800 rounded-lg w-16" />
            <div className="h-2 bg-zinc-800/50 rounded w-28" />
          </div>
        ))}
      </div>

      {/* Main Table / Grid Skeleton */}
      <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
        <div className="h-5 bg-zinc-800/80 rounded-lg w-48" />
        <div className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-800/40 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
