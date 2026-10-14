'use client';

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  Building2,
  User,
  ArrowRight,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { audioEngine } from '@/lib/audio';
import { Department } from '@/lib/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [department, setDepartment] = useState<Department>('Design');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Call backend Next.js API /api/auth/login with JWT & cookie
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch {
      // Non-blocking fallback
    }

    const res = await authService.login(email.trim(), password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Login failed');
      return;
    }

    audioEngine.playSuccessChime();
    onClose();

    // If company admin or employee, navigate to company workspace; if super admin, stay on main
    if (res.session?.user.role === 'super_admin') {
      window.location.href = '/';
    } else if (res.session?.company) {
      window.location.href = `/workspace/${res.session.company.subdomain}`;
    }
  };

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await authService.registerCompany({
      companyName,
      subdomain,
      adminName,
      email,
      password,
      department,
    });
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Registration failed');
      return;
    }

    audioEngine.playSuccessChime();
    setSuccess(`Company "${companyName}" successfully registered! Redirecting to your workspace...`);
    setTimeout(() => {
      onClose();
      window.location.href = `/workspace/${subdomain.toLowerCase()}`;
    }, 1200);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await authService.resetPassword(email.trim(), newPassword);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Reset failed');
      return;
    }

    setSuccess('Password updated successfully! You can now log in.');
    setTimeout(() => {
      setMode('login');
      setSuccess(null);
    }, 1500);
  };

  const fillQuickLogin = (demoEmail: string, demoPass = 'admin123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Banner */}
        <div className="text-center mb-5">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            Adsetspro SaaS
          </span>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
            {mode === 'login'
              ? 'Sign in to Workspace'
              : mode === 'register'
              ? 'Register Client Company'
              : 'Reset Your Password'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {mode === 'login'
              ? 'Enter your credentials to access your dedicated workspace.'
              : mode === 'register'
              ? 'Set up your company, provision your admin account & separate URL.'
              : 'Enter your account email and choose a new password.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-5">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              mode === 'login'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              mode === 'register'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Register Company
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Quick Demo Credential Buttons */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block text-center">
                Quick Demo Role & Designation Switch:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => fillQuickLogin('owner@adsetspro.com')}
                  className="p-1.5 text-left rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer font-bold"
                >
                  👑 Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickLogin('sarah@apex.agency')}
                  className="p-1.5 text-left rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer font-medium"
                >
                  🏢 Sarah (CEO)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickLogin('daniel@apex.agency')}
                  className="p-1.5 text-left rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer font-medium"
                >
                  💻 Daniel (Developer)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickLogin('elena@apex.agency')}
                  className="p-1.5 text-left rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer font-medium"
                >
                  🎨 Elena (Designer)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickLogin('priya@apex.agency')}
                  className="p-1.5 text-left rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer font-medium"
                >
                  📈 Priya (Marketer)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickLogin('alex@apex.agency')}
                  className="p-1.5 text-left rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer font-medium"
                >
                  🧪 Alex (Tester)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickLogin('aisha@apex.agency')}
                  className="p-1.5 text-left rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer font-medium"
                >
                  ✍️ Aisha (Writer)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickLogin('vikram@techflow.io')}
                  className="p-1.5 text-left rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer font-medium"
                >
                  🏢 Vikram (TechFlow)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 2. Register Client Company Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterCompany} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Company / Agency Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Nexus Media Group"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Company Subdomain (Dedicated URL)
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  required
                  placeholder="nexus"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 px-3 py-2 text-xs rounded-l-xl border border-r-0 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="px-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-r-xl border border-zinc-200 dark:border-zinc-700 font-mono">
                  .domain.com
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Admin Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Design">🎨 Design</option>
                  <option value="Development">💻 Development</option>
                  <option value="Content">✍️ Content</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Admin Work Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@nexusmedia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Choose a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2"
            >
              <span>{loading ? 'Provisioning...' : 'Register & Launch Workspace 🚀'}</span>
            </button>
          </form>
        )}

        {/* 3. Reset Password Form */}
        {mode === 'forgot' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Account Email
              </label>
              <input
                type="email"
                required
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
              >
                Back to Login
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
