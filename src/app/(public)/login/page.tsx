'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Authenticate via our server session endpoint
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      // Also attempt supabase client sign in if key configured (non-blocking)
      try {
        await supabase.auth.signInWithPassword({ email: email.trim(), password });
      } catch (e) {}

      // 2. Route based on role with full session reload
      if (data.is_super_admin) {
        window.location.href = '/super-admin/dashboard';
      } else if (data.companySlug) {
        if (data.user?.role === 'EMPLOYEE') {
          window.location.href = `/c/${data.companySlug}/my-tasks`;
        } else {
          window.location.href = `/c/${data.companySlug}/dashboard`;
        }
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-lg shadow-indigo-500/25 mb-2">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-sm text-zinc-400">Sign in to your enterprise workspace</p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 focus:outline-none cursor-pointer"
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Demo Roles */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 text-center">
            Quick Fill Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setEmail('owner@adsetsproflow.com');
                setPassword('SuperAdmin@2026!Secure');
              }}
              className="p-2 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors cursor-pointer group"
            >
              <span className="block font-bold text-amber-400 group-hover:text-amber-300">👑 Super Admin</span>
              <span className="text-[10px] text-zinc-500 block truncate">owner@adsetsproflow.com</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@p8-test.com');
                setPassword('SuperAdmin@2026!Secure');
              }}
              className="p-2 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors cursor-pointer group"
            >
              <span className="block font-bold text-indigo-400 group-hover:text-indigo-300">🏢 Company Admin</span>
              <span className="text-[10px] text-zinc-500 block truncate">admin@p8-test.com</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('depthead@p8-test.com');
                setPassword('SuperAdmin@2026!Secure');
              }}
              className="p-2 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors cursor-pointer group"
            >
              <span className="block font-bold text-emerald-400 group-hover:text-emerald-300">👥 Dept Head</span>
              <span className="text-[10px] text-zinc-500 block truncate">depthead@p8-test.com</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('employee@p8-test.com');
                setPassword('SuperAdmin@2026!Secure');
              }}
              className="p-2 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors cursor-pointer group"
            >
              <span className="block font-bold text-cyan-400 group-hover:text-cyan-300">💼 Employee</span>
              <span className="text-[10px] text-zinc-500 block truncate">employee@p8-test.com</span>
            </button>
          </div>
        </div>

        <div className="pt-2 text-center">
          <p className="text-sm text-zinc-400">
            Don&apos;t have an organization yet?{' '}
            <Link
              href="/register"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Register your company
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
