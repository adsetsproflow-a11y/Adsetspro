'use client';

import React, { useState, useEffect } from 'react';
import { LoginPage } from '@/components/LoginPage';
import { WorkspaceView } from '@/components/WorkspaceView';
import { SuperAdminPortalView } from '@/components/SuperAdminPortalView';
import { authService, AuthSession } from '@/lib/auth';
import { saasStore } from '@/lib/storage';
import { Shield, Building2, AlertTriangle, LogOut, Lock, RefreshCw } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mounted, setMounted] = useState(false);

  const syncSession = async () => {
    saasStore.initData();
    const synced = await authService.syncBackendSession();
    setSession(synced || authService.getSession());
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

  const handleLoginSuccess = (_role: string, _subdomain?: string) => {
    syncSession();
  };

  const handleLogout = () => {
    authService.logout();
    setSession(null);
  };

  // SSR or initial mounting state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-zinc-500">Initializing Adsetspro Portal...</p>
        </div>
      </div>
    );
  }

  // 1. Mandatory Gate: If not authenticated, ALWAYS present the Login Page first
  if (!session) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Platform Owner / Super Admin: Dedicated Master Console (Zero Tasks, Full Tenant Management)
  if (session.user.role === 'super_admin') {
    return <SuperAdminPortalView onLogout={handleLogout} />;
  }

  // 3. Client Company Users: Check Approval and Active Status
  const companies = saasStore.getCompanies();
  const currentCompany = companies.find((c) => c.id === session.user.company_id) || session.company;

  if (currentCompany && !currentCompany.is_active) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-lg w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center border border-red-500/30">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
              ⛔ Tenant Access Suspended (Toggled OFF)
            </span>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {currentCompany.name} Workspace Locked
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              This company workspace has been suspended by the platform administrator. All employee access is temporarily paused.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl p-4 text-left text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Tenant Subdomain:</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{currentCompany.subdomain}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Account Admin:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{session.user.full_name} ({session.user.email})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Status:</span>
              <span className="font-bold uppercase text-red-600 dark:text-red-400 text-[11px]">Suspended (OFF)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Super Admin Contact:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">owner@adsetsproflow.com</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => syncSession()}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Approval Status</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Log Out / Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Approved Client Company: Locked strictly to their tenant subdomain
  return (
    <WorkspaceView
      forcedSubdomain={currentCompany?.subdomain}
      onLogout={handleLogout}
    />
  );
}
