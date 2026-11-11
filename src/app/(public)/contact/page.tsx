'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  User,
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function ContactPage() {
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

    // 3. Strict 10-Digit Phone Validation
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
      setErrorMessage('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (/^(\d)\1+$/.test(digitsOnly) || '0123456789012345'.includes(digitsOnly) || '9876543210987654'.includes(digitsOnly)) {
      setErrorMessage('Please enter a genuine, active 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: digitsOnly,
          companyName: companyName.trim() || null,
          message: message.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry. Please try again.');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b18] text-zinc-100 flex flex-col relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-black">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-white/[0.08] bg-[#070b18]/90 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-cyan-400" />
            <span>Back to Home</span>
          </Link>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#070b18] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-black text-lg tracking-tight text-white">
              Adsetspro<span className="text-cyan-400">flow</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-xs text-zinc-400 hover:text-white font-medium transition-colors hidden sm:inline"
            >
              Pricing
            </Link>

            <Link
              href="/register"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-teal-500 to-indigo-600 hover:opacity-90 text-white transition-all shadow-md shadow-cyan-500/20"
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
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Information & Brand Value */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Direct Enterprise Assistance</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Let&apos;s build velocity for your startup.
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
              Have questions about multi-tenant workspace architecture, AI copilot capabilities, custom integrations, or pricing plans? Reach out and our core engineering team will contact you directly.
            </p>

            {/* Direct Contact Cards */}
            <div className="space-y-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Email Inquiry</p>
                  <a
                    href="mailto:contact@adsetsproflow.com"
                    className="text-sm font-bold text-white hover:text-cyan-400 transition-colors"
                  >
                    contact@adsetsproflow.com
                  </a>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Typical response within 2 hours</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Direct WhatsApp &amp; Call</p>
                  <p className="text-sm font-bold text-white">+91 98765 43210</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Mon - Sat, 09:00 AM - 07:00 PM IST</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Guaranteed Response</p>
                  <p className="text-xs text-zinc-300 font-medium">All enquiries are reviewed and answered directly by technical founders and product leads.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-10 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-2xl relative backdrop-blur-xl">
              {isSuccess ? (
                <div className="py-12 px-4 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    Thank You, {fullName.split(' ')[0]}!
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Your contact enquiry has been securely received by our enterprise team. We will call or email you at <strong className="text-white">{phone}</strong> / <strong className="text-white">{email}</strong> shortly.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href="/"
                      className="px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold border border-zinc-700 transition-colors"
                    >
                      Return to Home
                    </Link>
                    <Link
                      href="/register"
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 inline-flex items-center gap-1.5"
                    >
                      <span>Register Your Company</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Send us an Enquiry
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Fill in your details below and our team will get in touch with you.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Alex Johnson"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Work Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        Business Email <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alex@company.com"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone Number (Strict 10 Digits Only, No +91) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
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
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500">10-digit mobile number without +91</p>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        Company Name <span className="text-zinc-500 text-[10px]">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Acme Media Corp"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Message / Requirement <span className="text-zinc-500 text-[10px]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                      <textarea
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us about your team size, project requirements, or questions..."
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-600 hover:from-teal-400 hover:via-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting enquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Your details are encrypted &amp; stored directly in our verified registry.</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

