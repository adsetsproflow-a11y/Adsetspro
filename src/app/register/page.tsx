'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('Design');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredData, setRegisteredData] = useState<{
    companyName: string;
    slug: string;
    email: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          adminName,
          email,
          password,
          confirmPassword,
          department,
          acceptTerms,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        setError(data.error || 'Registration failed.');
        return;
      }

      setRegisteredData({
        companyName: data.company.name,
        slug: data.company.slug,
        email,
      });
    } catch (err: any) {
      setLoading(false);
      setError('Network or server error during registration.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                SAAA Platform
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 uppercase">
                SaaS
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Multi-Tenant Company Registration
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-10 flex flex-col justify-center">
        {registeredData ? (
          /* Registration Success Screen */
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                ⏳ Company Registration Submitted — Status: PENDING
              </span>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                Welcome, {registeredData.companyName}!
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                Your company registration has been recorded with slug{' '}
                <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                  /c/{registeredData.slug}
                </strong>
                .
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl p-4 text-left text-xs space-y-2.5">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Step 1: Verify your email.</strong> We sent a verification link to{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400">{registeredData.email}</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Step 2: Super Admin review.</strong> To preserve multi-tenant integrity, our
                  platform administrator reviews all new companies before full workspace access is activated.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/company/pending-approval?slug=${registeredData.slug}`}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <span>View Approval Status</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                <Building2 className="w-3.5 h-3.5" />
                <span>Company Registration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Register Your Company
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                Provision a dedicated workspace with automated collision-safe URL, role management, and task delegation.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Registration Error</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Digital Studios"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Administrator Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Lin"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Primary Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Design">🎨 Design</option>
                    <option value="Development">💻 Development</option>
                    <option value="Marketing">📈 Marketing</option>
                    <option value="Content">✍️ Content</option>
                    <option value="Management">🏢 Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Work Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="sarah@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Min 8 chars, 1 uppercase, 1 digit"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    I accept the{' '}
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                      Terms of Service
                    </span>{' '}
                    and acknowledge that workspace access is subject to Super Admin approval.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Creating Workspace...' : 'Register Company & Request Approval'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 text-xs text-zinc-500">
                Already registered?{' '}
                <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                  Sign in here
                </Link>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
