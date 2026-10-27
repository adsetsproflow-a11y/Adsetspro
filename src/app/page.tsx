'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, ArrowRight, Layers, Zap, LogOut, LayoutDashboard } from 'lucide-react';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    full_name?: string;
    is_super_admin?: boolean;
    companySlug?: string;
  } | null>(null);

  useEffect(() => {
    // Read session directly from saaa_session cookie
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)saaa_session=([^;]+)/);
      if (match && match[1]) {
        try {
          const decoded = atob(decodeURIComponent(match[1]));
          const parsed = JSON.parse(decoded);
          if (parsed?.id) {
            setCurrentUser(parsed);
          }
        } catch {}
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/';
  };

  const dashboardUrl = currentUser?.is_super_admin
    ? '/super-admin/dashboard'
    : currentUser?.companySlug
    ? `/c/${currentUser.companySlug}/dashboard`
    : '/login';

  return (
    <div className="min-h-screen bg-[#070b14] text-zinc-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Navigation bar */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl px-6 py-4 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Layers className="w-5 h-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">Adsetspro Platform</span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {currentUser ? (
            <>
              <Link
                href={dashboardUrl}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>My Workspace</span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/register"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Register Company
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 flex items-center justify-center px-4 py-16 relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Enterprise Multi-Tenant SaaS Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Next-Gen Project &amp; Task Orchestration
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Multi-tier role delegation, departmental task pipelines, peer reviews, realtime messaging, and deep team analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={currentUser ? dashboardUrl : '/login'}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>{currentUser ? 'Open Your Workspace' : 'Access Your Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Register New Organization</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-zinc-800/80 py-6 px-6 text-xs text-slate-500 dark:text-zinc-500 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© 2026 Adsetspro Platform.</p>
          <div className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <Link
              href="/terms"
              className="text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
