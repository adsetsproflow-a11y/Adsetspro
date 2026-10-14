'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { saasStore } from '@/lib/storage';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialTheme = saasStore.getTheme();
    setTheme(initialTheme);
    saasStore.setTheme(initialTheme);

    const unsubscribe = saasStore.subscribe(() => {
      setTheme(saasStore.getTheme());
    });
    return unsubscribe;
  }, []);

  const switchTheme = (targetTheme: 'dark' | 'light') => {
    setTheme(targetTheme);
    saasStore.setTheme(targetTheme);
  };

  if (!mounted) {
    return (
      <div className="h-8 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    );
  }

  return (
    <div
      className="inline-flex items-center p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-100 dark:bg-zinc-900 shadow-inner"
      role="group"
      aria-label="Theme mode selector"
    >
      {/* Light Mode Option */}
      <button
        onClick={() => switchTheme('light')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
        title="Switch to Light Mode"
      >
        <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : 'text-zinc-400'}`} />
        <span className="hidden xl:inline">Light</span>
      </button>

      {/* Dark Mode Option */}
      <button
        onClick={() => switchTheme('dark')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
          theme === 'dark'
            ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
        title="Switch to Dark Mode"
      >
        <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-zinc-400'}`} />
        <span className="hidden xl:inline">Dark</span>
      </button>
    </div>
  );
};
