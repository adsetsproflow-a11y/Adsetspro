'use client';

import React, { useState, useEffect } from 'react';
import { LoginPage } from '@/components/LoginPage';
import { WorkspaceView } from '@/components/WorkspaceView';
import { authService, AuthSession } from '@/lib/auth';
import { saasStore } from '@/lib/storage';
import { Shield, Building2, AlertTriangle, LogOut, ArrowRight, Lock } from 'lucide-react';

interface TenantWorkspaceClientProps {
  subdomain: string;
}

export const TenantWorkspaceClient: React.FC<TenantWorkspaceClientProps> = ({ subdomain }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mounted, setMounted] = useState(false);

  const syncSession = () => {
    saasStore.initData();
    const current = authService.getSession();
    setSession(current);
  };

  useEffect(() => {
    syncSession();
    setMounted(true);
    const unsub = saasStore.subscribe(() => {
      const current = authService.getSession();
      setSession(current);
    });
    return unsub;
  }, []);

  const handleLogout = () => {
    authService.logout();
    setSession(null);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Unauthenticated -> Login page first
  if (!session) {
    return <LoginPage onLoginSuccess={() => syncSession()} />;
  }

  // 2. Super Admin -> Allowed in any tenant
  if (session.user.role === 'super_admin') {
    return <WorkspaceView forcedSubdomain={subdomain} onLogout={handleLogout} />;
  }

  // 3. Multi-Tenant Isolation Check: User's company must match this subdomain
  const userSubdomain = session.company?.subdomain.toLowerCase();
  const requestedSubdomain = subdomain.toLowerCase();

  if (userSubdomain !== requestedSubdomain) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 mx-auto flex items-center justify-center border border-red-500/30">
            <Shield className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
              ⛔ Strict Multi-Tenant Isolation
            </span>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Cross-Tenant Access Denied
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              You are authenticated as a member of <strong>{session.company?.name || 'another company'}</strong>. Company data is strictly isolated and you cannot view <strong>{requestedSubdomain}.domain.com</strong>.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {session.company?.subdomain && (
              <a
                href={`/workspace/${session.company.subdomain}`}
                className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>Go to My Workspace ({session.company.name})</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={handleLogout}
              className="py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Log Out & Sign In with Another Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Company User
  return <WorkspaceView forcedSubdomain={subdomain} onLogout={handleLogout} />;
};
