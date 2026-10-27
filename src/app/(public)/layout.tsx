'use client';

import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex flex-col">
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-50 pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-all shadow-sm"
        >
          <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <Layers className="w-3 h-3" />
          </div>
          <span>Adsetspro Platform</span>
        </Link>

        <div className="pointer-events-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
