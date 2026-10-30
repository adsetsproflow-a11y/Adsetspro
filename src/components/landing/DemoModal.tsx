'use client';

import React, { useState } from 'react';
import { X, Sparkles, Building2, Briefcase, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [isDemoLaunching, setIsDemoLaunching] = useState<string | null>(null);
  const [demoLaunchError, setDemoLaunchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstantLaunch = async (role: 'admin' | 'employee') => {
    setIsDemoLaunching(role);
    setDemoLaunchError(null);

    const target = {
      admin: { email: 'admin@p8-test.com', password: 'SuperAdmin@2026!Secure', redirectUrl: '/c/p8-test-org/dashboard' },
      employee: { email: 'employee@p8-test.com', password: 'SuperAdmin@2026!Secure', redirectUrl: '/c/p8-test-org/my-tasks' },
    }[role];

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target.email, password: target.password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start demo session');
      }

      window.location.href = target.redirectUrl;
    } catch (err: any) {
      setDemoLaunchError(err?.message || 'Could not connect to demo workspace.');
      setIsDemoLaunching(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl relative max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            onClose();
            setDemoLaunchError(null);
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Interactive Demo</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Experience Adsetspro Flow
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            Launch directly into a live, pre-seeded startup workspace. Select a role below to explore features with zero signup or setup required.
          </p>
        </div>

        {/* Error Message if Demo Launch Fails */}
        {demoLaunchError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
            {demoLaunchError}
          </div>
        )}

        {/* INSTANT 1-CLICK DEMO ROLES */}
        <div className="space-y-3.5">
          {/* Role 1: Company Admin */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Company Admin
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Manage task pipelines, assign team work, review deliverables, and view company velocity.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isDemoLaunching !== null}
              onClick={() => handleInstantLaunch('admin')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
            >
              {isDemoLaunching === 'admin' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <span>Launch Admin Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Role 2: Team Member / Employee */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Team Member / Worker
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold">
                    Daily Flow
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Focused task queue, stopwatch timers, WebP compression studio, and real-time team chat.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isDemoLaunching !== null}
              onClick={() => handleInstantLaunch('employee')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white text-xs font-bold border border-slate-700 dark:border-zinc-700 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
            >
              {isDemoLaunching === 'employee' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <span>Launch Member Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-500 dark:text-zinc-500 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Instant access • No email or credit card required • 100% Sandbox safe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
