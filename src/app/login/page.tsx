'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Shield,
  Building2,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { audioEngine } from '@/lib/audio';

export default function StandaloneLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fillQuick = (demoEmail: string, demoPass = 'admin123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed. Please verify credentials.');
        audioEngine.playUrgentAlert();
        return;
      }

      audioEngine.playSuccessChime();
      setSuccess(`Welcome back, ${data.user.name}! Redirecting...`);

      // Redirect based on backend authorization logic
      const target = data.redirectUrl || '/';
      setTimeout(() => {
        router.push(target);
      }, 400);
    } catch {
      setLoading(false);
      setError('Unable to connect to the authentication service.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                SAAA SaaS
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 uppercase">
                Portal
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Multi-Tenant Authentication Gate
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            Register Company
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <Lock className="w-3.5 h-3.5" />
              <span>Authentication Gate</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Access your company projects, task pipelines, or super admin console.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Access Denied</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authenticated</p>
                <p className="mt-0.5">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switchers */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block text-center">
              Quick Demo Credential Switcher:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillQuick('owner@adsetsproflow.com', 'SuperAdmin@2026!Secure')}
                className="p-2 text-left rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer font-bold border border-transparent hover:border-indigo-300 dark:hover:border-indigo-800"
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuick('sarah@apex.agency', 'admin123')}
                className="p-2 text-left rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer font-medium border border-transparent hover:border-indigo-300 dark:hover:border-indigo-800"
              >
                🏢 Sarah (Apex Admin)
              </button>
              <button
                type="button"
                onClick={() => fillQuick('elena@apex.agency', 'admin123')}
                className="p-2 text-left rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer font-medium border border-transparent hover:border-indigo-300 dark:hover:border-indigo-800"
              >
                🎨 Elena (Employee)
              </button>
              <button
                type="button"
                onClick={() => fillQuick('john@acme.com', 'admin123')}
                className="p-2 text-left rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer font-medium border border-transparent hover:border-indigo-300 dark:hover:border-indigo-800"
              >
                ⏳ John (Pending Admin)
              </button>
            </div>
          </div>

          <div className="text-center pt-1 text-xs text-zinc-500">
            Need a new company workspace?{' '}
            <Link href="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
