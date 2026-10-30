'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex flex-col">
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-50 pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/90 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-white transition-all shadow-xs hover:shadow-md transform hover:-translate-x-0.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </Link>

        <div className="pointer-events-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
