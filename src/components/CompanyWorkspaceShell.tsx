'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Building2,
  AlertTriangle,
  LogOut,
  ArrowRight,
  Lock,
  ListTodo,
  Users,
  Mail,
  Settings,
  Sparkles,
  Layers,
  FileImage,
  MessageSquare,
  Trophy,
} from 'lucide-react';
import { WorkspaceView } from '@/components/WorkspaceView';
import { saasStore } from '@/lib/storage';

interface CompanyWorkspaceShellProps {
  companySlug: string;
  defaultTab?: 'dashboard' | 'employees' | 'invitations' | 'tasks' | 'settings' | 'my-tasks';
}

export const CompanyWorkspaceShell: React.FC<CompanyWorkspaceShellProps> = ({
  companySlug,
  defaultTab = 'dashboard',
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authData, setAuthData] = useState<any>(null);
  const [isCrossTenant, setIsCrossTenant] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (!data.success || !data.user) {
          router.push(`/login?redirect=/c/${companySlug}/dashboard`);
          return;
        }

        setAuthData(data);

        // Super Admin is allowed in any tenant
        if (data.user.globalRole === 'SUPER_ADMIN') {
          setLoading(false);
          return;
        }

        // Multi-tenant isolation verification
        const memberships = data.memberships || [];
        const currentMembership = memberships.find(
          (m: any) => m.company.slug.toLowerCase() === companySlug.toLowerCase()
        );

        if (!currentMembership) {
          setIsCrossTenant(true);
          setLoading(false);
          return;
        }

        const compStatus = currentMembership.company.status;
        if (compStatus === 'PENDING') {
          setIsPending(true);
        } else if (compStatus === 'SUSPENDED') {
          setIsSuspended(true);
        }
      } catch (err) {
        console.error('Workspace auth verification failed:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [companySlug, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-zinc-500">Verifying tenant access for /c/{companySlug}...</p>
        </div>
      </div>
    );
  }

  // Cross-tenant protection screen
  if (isCrossTenant) {
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
              You are signed in as <strong>{authData?.user?.email}</strong>. This user does not belong to the <strong>/c/{companySlug}</strong> company workspace. Data is strictly isolated across tenants.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {authData?.activeMembership?.companySlug && (
              <Link
                href={`/c/${authData.activeMembership.companySlug}/dashboard`}
                className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>Go to My Company ({authData.activeMembership.companyName})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Log Out & Sign In with Different Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pending approval screen
  if (isPending) {
    router.push(`/company/pending-approval?slug=${companySlug}`);
    return null;
  }

  // Suspended screen
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-lg w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 mx-auto flex items-center justify-center border border-red-500/30">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
              ⛔ Company Workspace Suspended
            </span>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              Workspace Access Suspended
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              The platform administrator has paused this company workspace. All employee and admin tools are locked.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              Refresh Status
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Authorized Company Workspace
  return (
    <WorkspaceView
      forcedSubdomain={companySlug}
      onLogout={handleLogout}
    />
  );
};
