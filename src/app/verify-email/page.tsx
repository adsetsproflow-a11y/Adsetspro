'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, RefreshCw, Mail, ArrowRight, Layers } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resend form state
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, [token]);

  const handleVerify = async (tok: string) => {
    setVerifying(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tok }),
      });

      const data = await res.json();
      setVerifying(false);

      if (res.ok && data.success) {
        setSuccess(data.message || 'Email successfully verified!');
      } else {
        setError(data.error || 'Invalid or expired verification token.');
      }
    } catch {
      setVerifying(false);
      setError('Network error while validating verification token.');
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendMessage(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });

      const data = await res.json();
      setResendLoading(false);
      setResendMessage(data.message || 'Verification link sent if account exists.');
    } catch {
      setResendLoading(false);
      setResendMessage('Failed to submit resend request.');
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center max-w-lg w-full mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          Email Verification
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Verify your work email address to secure your company workspace.
        </p>
      </div>

      {verifying && (
        <div className="py-8 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-zinc-500">Validating your verification link...</p>
        </div>
      )}

      {success && (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Email Address Verified!</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            {success} You can now log in to review your company workspace approval status.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
            >
              <span>Proceed to Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-left space-y-3">
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 font-bold text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Verification Link Failed</span>
          </div>
          <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Resend Verification Form */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-left space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Need a new verification link?
        </h3>
        <form onSubmit={handleResend} className="space-y-3">
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="Enter your registered work email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={resendLoading}
            className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{resendLoading ? 'Sending link...' : 'Resend Verification Email'}</span>
            <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
          </button>
        </form>

        {resendMessage && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            {resendMessage}
          </p>
        )}
      </div>

      <div className="pt-2">
        <Link href="/login" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
          Return to Login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
        <Suspense fallback={<div className="text-center text-xs text-zinc-400">Loading verification...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </main>
    </div>
  );
}
