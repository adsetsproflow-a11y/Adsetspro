'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  User,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
  Zap,
  ArrowRight,
  Headphones,
  CreditCard,
  Layers,
} from 'lucide-react';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('Growth Pro');
  const [teamSize, setTeamSize] = useState<string>('6 - 25 members');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validate Full Name
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    // 2. Validate Work Email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setErrorMessage('Please enter a valid work email address (e.g. name@company.com).');
      return;
    }

    // 3. Strict 10-Digit Phone Validation (No +91, Indian 10 digits starting with 6-9)
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
      setErrorMessage('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (
      /^(\d)\1+$/.test(digitsOnly) ||
      '0123456789012345'.includes(digitsOnly) ||
      '9876543210987654'.includes(digitsOnly)
    ) {
      setErrorMessage('Please enter a genuine, active 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: digitsOnly,
          companyName: companyName.trim() || null,
          planName: selectedPlan,
          teamSize,
          message: message.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit quote request. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setIsSubmitting(false);
    } catch {
      setErrorMessage('Network error while submitting. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-white flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px]" />

      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-[#070913]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-indigo-400" />
            <span>Back to Home</span>
          </Link>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#070913] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-black text-lg tracking-tight text-white">
              Adsetspro<span className="text-cyan-400">flow</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="text-xs text-zinc-400 hover:text-white font-medium transition-colors hidden sm:inline"
            >
              Contact Us
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:opacity-90 transition-opacity shadow-md shadow-indigo-500/20"
            >
              Register Now
            </Link>
            <div className="pl-1 border-l border-white/10 flex items-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4">
            <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Custom Pricing &amp; Enterprise Quote</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Get Custom Pricing for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-sky-400 to-indigo-400">
              Your Team
            </span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Fill in your details below. Our enterprise specialist will verify your 10-digit mobile number and send your tailored pricing proposal within 2 hours.
          </p>
        </div>

        {/* Form Container */}
        <div className="relative rounded-3xl bg-zinc-950/80 border border-zinc-800 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          {isSuccess ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-zinc-900/80 border border-emerald-500/30">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Pricing Request Submitted Successfully!</h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                We have received your request for the <strong className="text-indigo-400">{selectedPlan}</strong>. Our enterprise team will reach out directly at your verified 10-digit number.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setFullName('');
                    setEmail('');
                    setPhone('');
                    setCompanyName('');
                    setMessage('');
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Submit Another Request
                </button>
                <Link
                  href="/"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-md"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{errorMessage}</p>
                    <p className="text-[11px] text-red-400">
                      Please ensure your phone number is exactly 10 digits without +91 or special characters.
                    </p>
                  </div>
                </div>
              )}

              {/* Target Plan Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5">
                  Plan of Interest:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'Starter Solo', desc: 'Up to 5 members' },
                    { id: 'Growth Pro', desc: 'Up to 25 members (Popular)' },
                    { id: 'Enterprise Scale', desc: 'Unlimited custom seats' },
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedPlan === plan.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{plan.id}</span>
                        {selectedPlan === plan.id && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">{plan.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Size Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5">
                  Team / Workspace Size:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {['1 - 5 members', '6 - 25 members', '26 - 100 members', '100+ Enterprise'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTeamSize(size)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                        teamSize === size
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Work Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Phone Number (Strict 10 Digits Only) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>
                      Phone Number <span className="text-red-400">*</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">10 digits only</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(sanitized);
                      }}
                      placeholder="9876543210 (10 digits)"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono tracking-wider"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Indian 10-digit mobile number starting with 6-9. Do not enter +91.
                  </p>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Company / Organization Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Apex Innovations Pvt Ltd"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Specific Requirements / Message */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Specific Requirements or Team Workflows (Optional)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your team size, integrations needed, migration from other tools, or specific feature requirements..."
                  className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 hover:opacity-95 text-white transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Custom Quote &amp; Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Request Pricing Proposal for {selectedPlan}</span>
                    </>
                  )}
                </button>
                <p className="mt-2.5 text-center text-[11px] text-zinc-500">
                  🔒 Your contact information is never shared. Verified and stored securely in Super Admin Platform Registry.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Guarantees Strip */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5 text-center">
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <ShieldCheck className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-white">14-Day Money-Back Guarantee</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Risk-free trial with full access to enterprise features.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <Zap className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-white">Instant Provisioning</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Workspaces and team member invites active in seconds.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <Headphones className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-white">Direct WhatsApp VIP Support</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Real engineers available directly via phone &amp; WhatsApp.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#070913] py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 Adsetspro Flow Inc. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              Home
            </Link>
            <Link href="/contact" className="hover:text-zinc-300 transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
