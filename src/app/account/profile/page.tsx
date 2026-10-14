'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Shield,
  Building2,
  KeyRound,
  LogOut,
  Layers,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setMembership(data.activeMembership);
        }
      } catch {}
      setLoading(false);
    }
    loadMe();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/login';
  };

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

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Account Profile</h1>
              <p className="text-xs text-zinc-500">View your platform identity and company assignment.</p>
            </div>
            <Link
              href="/account/change-password"
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400">Loading profile...</div>
          ) : !user ? (
            <div className="py-12 text-center text-xs text-zinc-400 space-y-3">
              <p>You are not currently logged in.</p>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                    {user.name}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {user.globalRole}
                    </span>
                    {user.emailVerified && (
                      <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Context */}
              {membership ? (
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Company Workspace Membership
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-400 block">Company:</span>
                      <strong className="text-zinc-800 dark:text-zinc-200">{membership.companyName}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Workspace Slug:</span>
                      <Link
                        href={`/c/${membership.companySlug}/dashboard`}
                        className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                      >
                        /c/{membership.companySlug}
                      </Link>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Company Role:</span>
                      <span className="font-bold">{membership.role}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Designation:</span>
                      <span>{membership.designation || 'Team Member'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Department:</span>
                      <span>{membership.department || 'Operations'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Approval Status:</span>
                      <span
                        className={`font-bold ${
                          membership.companyStatus === 'ACTIVE'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {membership.companyStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                  Global Platform Administrator account (Unrestricted platform telemetry access).
                </div>
              )}

              {/* Security info */}
              <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 text-xs text-zinc-500 flex items-start gap-2">
                <Lock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span>
                  Role assignments and company affiliations are strictly managed through platform governance and cannot be modified by user request data.
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <Link
                  href="/"
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  ← Return to Workspace
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
