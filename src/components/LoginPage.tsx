'use client';

import React, { useState } from 'react';
import {
  Shield,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { audioEngine } from '@/lib/audio';
import { ThemeToggle } from './ThemeToggle';

interface LoginPageProps {
  onLoginSuccess: (role: string, subdomain?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'super_admin' | 'company'>('super_admin');
  const [email, setEmail] = useState('owner@adsetspro.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (tab: 'super_admin' | 'company') => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
    if (tab === 'super_admin') {
      setEmail('owner@adsetspro.com');
    } else {
      setEmail('sarah@apex.agency');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Backend JWT API authentication
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch {}

    const res = await authService.login(email.trim(), password);
    setLoading(false);

    if (!res.success || !res.session) {
      setError(res.error || 'Authentication failed. Please check credentials.');
      audioEngine.playUrgentAlert();
      return;
    }

    audioEngine.playSuccessChime();
    setSuccess(`Welcome back, ${res.session.user.full_name}! Redirecting...`);

    setTimeout(() => {
      onLoginSuccess(res.session!.user.role, res.session!.company?.subdomain);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                Adsetspro SaaS
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 uppercase">
                Platform
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Multi-Tenant Workspace & Role-Based Access
            </p>
          </div>
        </div>

        <ThemeToggle />
      </header>

      {/* Main Login Card */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12 flex flex-col justify-center items-center">
        <div className="w-full bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <Lock className="w-3.5 h-3.5" />
              <span>Authentication Gate</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Please authenticate with your credentials to access your tenant tools or global platform controls.
            </p>
          </div>

          {/* Two Clean Tabs: Super Admin vs Company User */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl gap-1.5">
            <button
              type="button"
              onClick={() => handleTabChange('super_admin')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'super_admin'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>👑 Super Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('company')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'company'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>🏢 Company Login</span>
            </button>
          </div>

          {/* Feedback Alerts */}
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
                <p className="font-bold">Success</p>
                <p className="mt-0.5">{success}</p>
              </div>
            </div>
          )}

          {/* Clean Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {activeTab === 'super_admin' ? 'Super Admin Email Address' : 'Company Employee / Admin Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={activeTab === 'super_admin' ? 'owner@adsetspro.com' : 'sarah@apex.agency'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
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
              <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
                <span>Default password: <strong className="text-indigo-500 font-mono">admin123</strong></span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Authenticating...'
                  : activeTab === 'super_admin'
                  ? 'Sign In as Super Admin'
                  : 'Sign In to Company Workspace'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-400">
        Adsetspro SaaS Platform • Strict Multi-Tenant Data Isolation & Role Based Access Control
      </footer>
    </div>
  );
};
