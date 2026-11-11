'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Building2,
  Briefcase,
  Loader2,
  ArrowRight,
  CheckCircle2,
  User,
  Mail,
  Phone,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [isDemoLaunching, setIsDemoLaunching] = useState<'admin' | 'employee' | null>(null);
  const [demoLaunchError, setDemoLaunchError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Remember previously submitted lead
  const [isAlreadyUnlocked, setIsAlreadyUnlocked] = useState(false);
  const [savedLeadName, setSavedLeadName] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const leadId = localStorage.getItem('demo_lead_id');
    const leadName = localStorage.getItem('demo_lead_name');
    const unlocked = localStorage.getItem('demo_access_unlocked');

    if (!unlocked || (!leadId && !leadName)) {
      setIsAlreadyUnlocked(false);
      setSavedLeadName('');
      return;
    }

    // Verify against DB if lead actually exists (handles cases where lead was deleted by Super Admin)
    const verifyLeadStatus = async () => {
      try {
        const q = new URLSearchParams({ verify: 'true' });
        if (leadId) q.set('leadId', leadId);
        if (leadName) q.set('name', leadName);

        const res = await fetch(`/api/demo/request-access?${q.toString()}`);
        const data = await res.json();

        if (data?.valid && data?.lead) {
          setIsAlreadyUnlocked(true);
          setSavedLeadName(data.lead.fullName || leadName || 'Guest');
        } else {
          // Lead was deleted from DB (or never existed)! Purge stale state and display form
          localStorage.removeItem('demo_access_unlocked');
          localStorage.removeItem('demo_lead_name');
          localStorage.removeItem('demo_lead_id');
          document.cookie = 'demo_access_unlocked=; Max-Age=0; path=/;';
          setIsAlreadyUnlocked(false);
          setSavedLeadName('');
        }
      } catch {
        // Fallback: if network fails or error, do not assume unlocked
        setIsAlreadyUnlocked(false);
        setSavedLeadName('');
      }
    };

    verifyLeadStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const validateInputs = () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setDemoLaunchError('Please enter your full name (at least 2 characters).');
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setDemoLaunchError('Please enter a valid work email address (e.g. name@company.com).');
      return false;
    }

    const emailDomain = email.trim().toLowerCase().split('@')[1];
    const disposable = [
      'tempmail.com', 'mailinator.com', '10minutemail.com', 'guerrillamail.com',
      'throwawaymail.com', 'yopmail.com', 'sharklasers.com', 'dispostable.com',
      'test.com', 'example.com'
    ];
    if (emailDomain && disposable.includes(emailDomain)) {
      setDemoLaunchError('Please provide a genuine permanent work or personal email address.');
      return false;
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setDemoLaunchError('Please enter a valid 10-digit phone number (do not include +91).');
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
      setDemoLaunchError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return false;
    }

    if (/^(\d)\1+$/.test(digitsOnly) || '0123456789012345'.includes(digitsOnly) || '9876543210987654'.includes(digitsOnly)) {
      setDemoLaunchError('Please enter a genuine, active 10-digit phone number.');
      return false;
    }

    return true;
  };

  const handleLaunchWithLead = async (role: 'admin' | 'employee') => {
    setDemoLaunchError(null);

    // If not previously unlocked, require valid contact details
    if (!isAlreadyUnlocked) {
      if (!validateInputs()) return;
    }

    setIsDemoLaunching(role);

    try {
      // 1. Submit lead to database & Google Sheets webhook if not already stored
      if (!isAlreadyUnlocked) {
        try {
          const leadRes = await fetch('/api/demo/request-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: fullName.trim(),
              email: email.trim(),
              phone: phone.trim(),
              companyName: companyName.trim() || null,
              requestedRole: role === 'admin' ? 'Company Admin' : 'Team Member',
            }),
          });
          const leadData = await leadRes.json();
          if (leadData?.lead?.id) {
            localStorage.setItem('demo_lead_id', leadData.lead.id);
          }
          localStorage.setItem('demo_access_unlocked', 'true');
          localStorage.setItem('demo_lead_name', fullName.trim());
        } catch (leadErr) {
          console.warn('[DemoModal] Lead sync error (proceeding to launch):', leadErr);
        }
      }

      // 2. Authenticate session as chosen demo account
      const target = {
        admin: {
          email: 'admin@p8-test.com',
          password: 'SuperAdmin@2026!Secure',
          redirectUrl: '/c/p8-test-org/dashboard',
        },
        employee: {
          email: 'employee@p8-test.com',
          password: 'SuperAdmin@2026!Secure',
          redirectUrl: '/c/p8-test-org/my-tasks',
        },
      }[role];

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target.email, password: target.password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize demo session');
      }

      // 3. Direct redirect to live workspace
      window.location.href = target.redirectUrl;
    } catch (err: any) {
      setDemoLaunchError(err?.message || 'Could not connect to demo workspace.');
      setIsDemoLaunching(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl relative max-h-[92vh] overflow-y-auto text-zinc-100"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            onClose();
            setDemoLaunchError(null);
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Interactive Demo</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white">
            Experience Adsetspro Flow
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400">
            {isAlreadyUnlocked
              ? `Welcome back, ${savedLeadName || 'Demo Tester'}! Choose your role below to launch directly into the live workspace.`
              : 'Enter your contact details below to instantly unlock full access to live enterprise workspaces.'}
          </p>
        </div>

        {/* Error Message */}
        {demoLaunchError && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{demoLaunchError}</span>
          </div>
        )}

        {/* Contact Form (Shown if not yet unlocked) */}
        {!isAlreadyUnlocked ? (
          <div className="space-y-3.5 mb-5 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300">
                  Business Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(digits);
                    }}
                    placeholder="9876543210 (10 digits)"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300">
                  Company / Organization <span className="text-zinc-500 text-[10px]">(Optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Media Corp"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Demo access verified for <strong>{savedLeadName || 'Guest'}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('demo_access_unlocked');
                localStorage.removeItem('demo_lead_name');
                localStorage.removeItem('demo_lead_id');
                document.cookie = 'demo_access_unlocked=; Max-Age=0; path=/;';
                setIsAlreadyUnlocked(false);
                setSavedLeadName('');
              }}
              className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Change Details
            </button>
          </div>
        )}

        {/* 1-CLICK LAUNCH BUTTONS */}
        <div className="space-y-3">
          {/* Role 1: Company Admin */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-indigo-500 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Company Admin</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Manage task pipelines, assign team work, review deliverables, and view company velocity.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isDemoLaunching !== null}
              onClick={() => handleLaunchWithLead('admin')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
            >
              {isDemoLaunching === 'admin' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Launching Live Admin...</span>
                </>
              ) : (
                <>
                  <span>Launch Admin Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Role 2: Team Member / Worker */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Team Member / Worker</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">
                    Daily Flow
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Focused task queue, stopwatch timers, deliverable submissions, and real-time team chat.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isDemoLaunching !== null}
              onClick={() => handleLaunchWithLead('employee')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
            >
              {isDemoLaunching === 'employee' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Launching Live Member...</span>
                </>
              ) : (
                <>
                  <span>Launch Member Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <div className="pt-2 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Instant sandbox entry • Verified contact data securely synced • No credit card required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
