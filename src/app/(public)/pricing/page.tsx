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
  HelpCircle,
  Headphones,
  Users,
} from 'lucide-react';
import ThemeToggle from '@/components/common/ThemeToggle';

interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  features: string[];
  badge?: string;
  ctaText: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter Solo',
    tagline: 'Ideal for indie hackers, founders & teams up to 5.',
    monthlyPrice: 999,
    annualPrice: 799,
    features: [
      'Up to 5 Workspace Members',
      'Unlimited Tasks & Kanban Boards',
      'AI Smart Task Breakdowns',
      'WebP Media Compression Studio',
      'Real-Time In-App Team Chat',
      'Community & Standard Email Support',
    ],
    ctaText: 'Select Starter Plan',
  },
  {
    id: 'growth',
    name: 'Growth Pro',
    tagline: 'The gold standard for high-velocity teams scaling fast.',
    monthlyPrice: 2499,
    annualPrice: 1999,
    popular: true,
    badge: 'MOST POPULAR',
    features: [
      'Up to 25 Workspace Members',
      'Unlimited Projects & Roadmaps',
      'Autonomous AI Knowledge Mesh Copilot',
      'Advanced Velocity & Sprint Analytics',
      'Instant Webhook & Sheets Integrations',
      'Automated WhatsApp Alerts & Reminders',
      'Priority 1-Hour SLA Support',
    ],
    ctaText: 'Select Growth Plan',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Scale',
    tagline: 'Custom infrastructure, unlimited seats & dedicated SLA.',
    monthlyPrice: 7999,
    annualPrice: 6499,
    badge: 'CUSTOM SCALE',
    features: [
      'Unlimited Seats & Companies',
      'Dedicated Private Cloud / Supabase Instance',
      'Custom Domain & White-Label Branding',
      'Enterprise SSO & SAML Authentication',
      '99.99% Guaranteed Uptime SLA',
      'Dedicated Account Manager & Concierge Onboarding',
      'Direct Phone & 24/7 WhatsApp VIP Hotline',
    ],
    ctaText: 'Request Enterprise Quote',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
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

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    const formElement = document.getElementById('pricing-quote-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
    <div className="min-h-screen bg-[#070913] text-white flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-[#070913]/80 backdrop-blur-md sticky top-0 z-40">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Transparent, Scalable Startup Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Plans built to accelerate your team from{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-sky-400 to-indigo-400">
              day 1 to scale
            </span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Zero hidden fees. Unlimited projects. Switch plans or cancel anytime with complete data ownership.
          </p>

          {/* Monthly / Annual Billing Toggle */}
          <div className="mt-8 inline-flex items-center p-1 rounded-full bg-zinc-900 border border-zinc-800 shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-black leading-none">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20 items-stretch">
          {PRICING_TIERS.map((tier) => {
            const price = billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;
            const isSelected = selectedPlan === tier.name;

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all duration-300 ${
                  tier.popular
                    ? 'bg-gradient-to-b from-indigo-950/60 to-zinc-950 border-2 border-indigo-500/80 shadow-2xl shadow-indigo-500/20 scale-[1.02]'
                    : 'bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 shadow-xl'
                }`}
              >
                {/* Popular or Custom Badge */}
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shadow-lg ${
                        tier.popular
                          ? 'bg-gradient-to-r from-indigo-500 to-cyan-400 text-black'
                          : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-black text-white">{tier.name}</h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                    {tier.tagline}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">/ month</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {billingCycle === 'annual' ? 'Billed annually (save 20%)' : 'Billed monthly, cancel anytime'}
                  </p>

                  <div className="my-6 border-t border-zinc-800/80" />

                  {/* Feature List */}
                  <ul className="space-y-3 text-xs text-zinc-300">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(tier.name)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      tier.popular
                        ? 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 hover:opacity-95 text-white shadow-lg shadow-indigo-500/25'
                        : isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    <span>{isSelected ? 'Selected Plan' : tier.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise & Custom Quote Form */}
        <div id="pricing-quote-form" className="scroll-mt-24">
          <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Interactive Plan Activation
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Get a Custom Quote &amp; Instant Onboarding
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-zinc-400">
                  Select your configuration below. Our enterprise specialist will verify your 10-digit mobile number and send your tailored proposal within 2 hours.
                </p>
              </div>

              {isSuccess ? (
                <div className="p-8 sm:p-12 text-center rounded-2xl bg-zinc-900/80 border border-emerald-500/30">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Pricing Request Submitted Successfully!</h3>
                  <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                    We have received your request for the <strong className="text-indigo-400">{selectedPlan}</strong>. Our enterprise team will call or WhatsApp you directly at your verified number.
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

                  {/* Plan Selection Chips */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                      Target Plan:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {['Starter Solo', 'Growth Pro', 'Enterprise Scale'].map((plan) => (
                        <button
                          key={plan}
                          type="button"
                          onClick={() => setSelectedPlan(plan)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                            selectedPlan === plan
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          <span>{plan}</span>
                          {selectedPlan === plan && <Check className="w-4 h-4 text-indigo-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Team Size Selection Chips */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                      Team / Organization Size:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['1 - 5 members', '6 - 25 members', '26 - 100 members', '100+ Enterprise'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setTeamSize(size)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                            teamSize === size
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contact Fields */}
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
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
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
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Phone Number (Strict 10 Digits) */}
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
                            // Strip any non-digit character and prevent >10 digits
                            const sanitized = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhone(sanitized);
                          }}
                          placeholder="9876543210 (10 digits)"
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono tracking-wider"
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-500">
                        Please enter valid Indian 10 digits starting with 6-9. Do not enter +91.
                      </p>
                    </div>

                    {/* Company Name */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Company / Organization
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Apex Innovations Pvt Ltd"
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Requirements / Message */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Specific Requirements or Custom Needs (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your team workflows, migrations from Jira/ClickUp, or custom integrations required..."
                      className="w-full p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
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
                          <span>Request Proposal for {selectedPlan}</span>
                        </>
                      )}
                    </button>
                    <p className="mt-2.5 text-center text-[11px] text-zinc-500">
                      🔒 Your contact information is never shared or sold. 100% encrypted &amp; stored permanently in Platform Registry.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Guarantees Strip */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <ShieldCheck className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-white">14-Day Money-Back Guarantee</h4>
            <p className="text-[11px] text-zinc-400 mt-1">
              Test full enterprise features risk-free with immediate refund if unsatisfied.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <Zap className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-white">Instant Provisioning</h4>
            <p className="text-[11px] text-zinc-400 mt-1">
              Workspaces, AI mesh routing, and member invites are active in under 30 seconds.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <Headphones className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-white">Direct WhatsApp VIP Support</h4>
            <p className="text-[11px] text-zinc-400 mt-1">
              Real human engineers available directly via phone &amp; WhatsApp for any setup assistance.
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

