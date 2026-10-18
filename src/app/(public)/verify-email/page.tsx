'use client';

import React from 'react';
import Link from 'next/link';
import { MailCheck, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative z-10 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
          <MailCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Email Verified Successfully
          </h1>
          <p className="text-sm text-zinc-400">
            Your identity has been validated with Supabase Authentication.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3 text-left">
          <Clock className="w-5 h-5 shrink-0 text-amber-400" />
          <p>
            Your organization workspace is currently in the <strong className="font-semibold">pending approval</strong> queue. You will receive access once the Super Administrator activates your tenant.
          </p>
        </div>

        <Link
          href="/login"
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <span>Continue to Login</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
