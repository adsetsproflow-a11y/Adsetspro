'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Shield,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  X,
  User,
  Phone,
  Building,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // Regular login credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Demo Access Gate State
  const [isDemoUnlocked, setIsDemoUnlocked] = useState(false);
  const [leadName, setLeadName] = useState<string>('');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoFullName, setDemoFullName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoFormError, setDemoFormError] = useState<string | null>(null);
  const [demoSuccessMessage, setDemoSuccessMessage] = useState<string | null>(null);

  // Check on mount if visitor previously unlocked demo access, verifying against DB
  useEffect(() => {
    const checkDemoAccess = async () => {
      try {
        const stored = localStorage.getItem('demo_access_unlocked');
        const storedName = localStorage.getItem('demo_lead_name');
        const storedId = localStorage.getItem('demo_lead_id');

        if (stored !== 'true' || (!storedName && !storedId)) {
          setIsDemoUnlocked(false);
          setLeadName('');
          return;
        }

        const q = new URLSearchParams({ verify: 'true' });
        if (storedId) q.set('leadId', storedId);
        if (storedName) q.set('name', storedName);

        const res = await fetch(`/api/demo/request-access?${q.toString()}`);
        const data = await res.json();

        if (data?.valid && data?.lead) {
          setIsDemoUnlocked(true);
          setLeadName(data.lead.fullName || storedName || 'Guest');
        } else {
          // Lead was deleted from DB! Revoke unlock
          localStorage.removeItem('demo_access_unlocked');
          localStorage.removeItem('demo_lead_name');
          localStorage.removeItem('demo_lead_id');
          document.cookie = 'demo_access_unlocked=; Max-Age=0; path=/;';
          setIsDemoUnlocked(false);
          setLeadName('');
        }
      } catch {
        setIsDemoUnlocked(false);
      }
    };

    checkDemoAccess();
  }, []);

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

  // Handle Demo Access Form Submission
  const handleUnlockDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoFormError(null);

    // Client-side validations
    if (!demoFullName.trim() || demoFullName.trim().length < 2) {
      setDemoFormError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(demoEmail.trim())) {
      setDemoFormError('Please enter a valid work email address (e.g. name@company.com).');
      return;
    }

    const emailDomain = demoEmail.trim().toLowerCase().split('@')[1];
    const disposable = [
      'tempmail.com', 'mailinator.com', '10minutemail.com', 'guerrillamail.com',
      'throwawaymail.com', 'yopmail.com', 'sharklasers.com', 'dispostable.com',
      'trashmail.com', 'fakeinbox.com', 'test.com', 'example.com'
    ];
    if (emailDomain && disposable.includes(emailDomain)) {
      setDemoFormError('Please provide a genuine permanent work or personal email address.');
      return;
    }

    const phoneDigits = demoPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setDemoFormError('Please enter a valid phone number (10 to 15 digits).');
      return;
    }

    if (/^(\d)\1+$/.test(phoneDigits) || '0123456789012345'.includes(phoneDigits) || '9876543210987654'.includes(phoneDigits)) {
      setDemoFormError('Please enter a genuine, active phone number.');
      return;
    }

    setDemoSubmitting(true);
    try {
      const res = await fetch('/api/demo/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: demoFullName.trim(),
          email: demoEmail.trim(),
          phone: demoPhone.trim(),
          companyName: demoCompany.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to unlock demo access.');
      }

      // Persist unlock state
      if (data?.lead?.id) {
        localStorage.setItem('demo_lead_id', data.lead.id);
      }
      localStorage.setItem('demo_access_unlocked', 'true');
      localStorage.setItem('demo_lead_name', demoFullName.trim());
      setIsDemoUnlocked(true);
      setLeadName(demoFullName.trim());
      setDemoSuccessMessage('Demo access unlocked! Select any demo account below.');

      // Close modal after brief confirmation
      setTimeout(() => {
        setIsDemoModalOpen(false);
      }, 700);
    } catch (err: any) {
      setDemoFormError(err.message || 'Error unlocking demo. Please try again.');
    } finally {
      setDemoSubmitting(false);
    }
  };

  const handleSelectDemoRole = (demoEmailValue: string, demoPasswordValue: string) => {
    setEmail(demoEmailValue);
    setPassword(demoPasswordValue);
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

        {demoSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{demoSuccessMessage}</span>
          </div>
        )}

        {/* Regular Login Form (Untouched & Preserved) */}
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

        {/* Demo Roles Section: Locked Gate vs Unlocked Accounts */}
        {!isDemoUnlocked ? (
          <div className="pt-3 border-t border-zinc-800/80">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-zinc-950/70 to-purple-950/30 border border-indigo-500/20 text-center space-y-3 shadow-md">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Interactive Demo Workspace
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Test all 4 enterprise roles (Super Admin, Company Admin, Dept Head, Employee) in a live sandbox.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDemoFormError(null);
                  setIsDemoModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Unlock Demo Access</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] px-1">
              <span className="font-semibold text-emerald-400 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Demo Access Active {leadName ? `(${leadName})` : ''}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setDemoFormError(null);
                  setIsDemoModalOpen(true);
                }}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
              >
                Edit Info
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSelectDemoRole('owner@adsetsproflow.com', 'SuperAdmin@2026!Secure')}
                className="p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors cursor-pointer group"
              >
                <span className="block font-bold text-amber-400 group-hover:text-amber-300">👑 Super Admin</span>
                <span className="text-[10px] text-zinc-500 block truncate">owner@adsetsproflow.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectDemoRole('admin@p8-test.com', 'SuperAdmin@2026!Secure')}
                className="p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors cursor-pointer group"
              >
                <span className="block font-bold text-indigo-400 group-hover:text-indigo-300">🏢 Company Admin</span>
                <span className="text-[10px] text-zinc-500 block truncate">admin@p8-test.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectDemoRole('depthead@p8-test.com', 'SuperAdmin@2026!Secure')}
                className="p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors cursor-pointer group"
              >
                <span className="block font-bold text-emerald-400 group-hover:text-emerald-300">👥 Dept Head</span>
                <span className="text-[10px] text-zinc-500 block truncate">depthead@p8-test.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectDemoRole('employee@p8-test.com', 'SuperAdmin@2026!Secure')}
                className="p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors cursor-pointer group"
              >
                <span className="block font-bold text-cyan-400 group-hover:text-cyan-300">💼 Employee</span>
                <span className="text-[10px] text-zinc-500 block truncate">employee@p8-test.com</span>
              </button>
            </div>
          </div>
        )}

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

      {/* DEMO ACCESS LEAD CAPTURE MODAL */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Unlock Demo Workspace</h3>
                  <p className="text-[11px] text-zinc-400">
                    Provide your contact info to immediately explore all live roles.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {demoFormError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{demoFormError}</span>
              </div>
            )}

            <form onSubmit={handleUnlockDemoSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={demoFullName}
                    onChange={(e) => setDemoFullName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Business Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel"
                    required
                    value={demoPhone}
                    onChange={(e) => setDemoPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210 (min 10 digits)"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Company / Org Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Company / Organization <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={demoCompany}
                    onChange={(e) => setDemoCompany(e.target.value)}
                    placeholder="e.g. Acme Media Corp"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={demoSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {demoSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Unlocking Demo Workspace...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Unlock Instant Demo Access</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                Your data is stored securely in our verified inquiry registry and synced for instant access.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
