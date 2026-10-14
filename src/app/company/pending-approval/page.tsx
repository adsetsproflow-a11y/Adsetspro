'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, ShieldAlert, RefreshCw, LogOut, CheckCircle, ArrowRight, Layers } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

function PendingApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string>('PENDING');
  const [companyName, setCompanyName] = useState<string>('Your Company');

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setChecking(false);

      if (data.success && data.activeMembership) {
        setStatus(data.activeMembership.companyStatus);
        setCompanyName(data.activeMembership.companyName);

        if (data.activeMembership.companyStatus === 'ACTIVE') {
          router.push(`/c/${data.activeMembership.companySlug}/dashboard`);
        }
      }
    } catch {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl text-center max-w-lg w-full mx-auto space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
        <Clock className="w-8 h-8 animate-pulse" />
      </div>

      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
          ⏳ Registration Awaiting Super Admin Review
        </span>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
          {companyName} Workspace Pending Approval
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          Thank you for registering. Our platform owner reviews every new tenant registration to prevent abuse and verify company credentials.
        </p>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl p-4 text-left text-xs space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-zinc-500">Assigned Slug:</span>
          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
            {slug ? `/c/${slug}` : 'Generating...'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500">Current Status:</span>
          <span className="font-bold uppercase text-amber-600 dark:text-amber-400 text-[11px]">
            {status}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500">Platform Support:</span>
          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
            owner@adsetspro.com
          </span>
        </div>
      </div>

      {status === 'ACTIVE' ? (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>Workspace Approved!</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Your company has been approved by the Super Admin. You can now access your dashboard.
          </p>
          <div className="pt-2">
            <Link
              href={`/c/${slug}/dashboard`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status...' : 'Check Approval Status'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
              SAAA Platform
            </span>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <Suspense fallback={<div className="text-center text-xs text-zinc-400">Loading status...</div>}>
          <PendingApprovalContent />
        </Suspense>
      </main>
    </div>
  );
}
