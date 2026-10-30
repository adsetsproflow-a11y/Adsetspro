'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  MessageSquare,
  BarChart3,
  Users,
  Zap,
  Clock,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  X,
  Send,
  Building2,
  Check,
  Flame,
  TrendingUp,
  Cpu,
  ArrowUp,
  Loader2,
  Briefcase,
} from 'lucide-react';
import ThemeToggle from '@/components/common/ThemeToggle';
import AiNeuralCanvas from '@/components/landing/AiNeuralCanvas';
import AiHolographicSides from '@/components/landing/AiHolographicSides';
import AiInteractiveTerminal from '@/components/landing/AiInteractiveTerminal';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    full_name?: string;
    is_super_admin?: boolean;
    companySlug?: string;
  } | null>(null);

  // FAQ open state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Demo modal state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isDemoLaunching, setIsDemoLaunching] = useState<string | null>(null);
  const [demoLaunchError, setDemoLaunchError] = useState<string | null>(null);

  const handleInstantLaunch = async (role: 'admin' | 'employee') => {
    setIsDemoLaunching(role);
    setDemoLaunchError(null);

    const target = {
      admin: { email: 'admin@p8-test.com', password: 'SuperAdmin@2026!Secure', redirectUrl: '/c/p8-test-org/dashboard' },
      employee: { email: 'employee@p8-test.com', password: 'SuperAdmin@2026!Secure', redirectUrl: '/c/p8-test-org/my-tasks' },
    }[role];

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target.email, password: target.password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start demo session');
      }

      window.location.href = target.redirectUrl;
    } catch (err: any) {
      setDemoLaunchError(err?.message || 'Could not connect to demo workspace.');
      setIsDemoLaunching(null);
    }
  };

  // Top-to-go (scroll to top) state & progress percentage (0 to 1)
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;
        setScrollProgress(progress);
        setShowScrollTop(scrollTop > 200);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    // Read session directly from saaa_session cookie
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)saaa_session=([^;]+)/);
      if (match && match[1]) {
        try {
          const decoded = atob(decodeURIComponent(match[1]));
          const parsed = JSON.parse(decoded);
          if (parsed?.id) {
            setCurrentUser(parsed);
          }
        } catch {}
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/';
  };

  const dashboardUrl = currentUser?.is_super_admin
    ? '/super-admin/dashboard'
    : currentUser?.companySlug
    ? `/c/${currentUser.companySlug}/dashboard`
    : '/login';

  const faqs = [
    {
      q: '1. What is Adsetspro Flow?',
      a: 'Adsetspro Flow is an all-in-one project management tool that helps startups and teams organize tasks, manage projects, track progress, and collaborate efficiently.',
    },
    {
      q: '2. Who can use Adsetspro Flow?',
      a: 'Adsetspro Flow is ideal for startups, small businesses, freelancers, and growing teams looking to manage projects and improve productivity.',
    },
    {
      q: '3. What features does Adsetspro Flow offer?',
      a: 'Adsetspro Flow offers AI assistance, team chat, smart analytics, and task management to help teams plan, collaborate, and complete work efficiently.',
    },
    {
      q: '4. How does Adsetspro Flow improve team productivity?',
      a: 'It simplifies task assignments, tracks deadlines, centralizes team communication, and helps everyone stay aligned with project goals.',
    },
    {
      q: '5. Can Adsetspro Flow help startups manage multiple projects?',
      a: 'Yes, Adsetspro Flow helps startups organize multiple projects, prioritize tasks, monitor progress, and keep their teams focused on business goals.',
    },
  ];

  const startupLogos = [
    { name: 'ApexFlow', icon: Flame, color: 'text-amber-500' },
    { name: 'Pulse AI', icon: Cpu, color: 'text-cyan-500' },
    { name: 'NovaScale', icon: TrendingUp, color: 'text-indigo-500' },
    { name: 'TechFlow', icon: Layers, color: 'text-emerald-500' },
    { name: 'CloudSync', icon: Zap, color: 'text-blue-500' },
    { name: 'HyperLoop', icon: Sparkles, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] bg-grid-pattern text-slate-900 dark:text-zinc-100 flex flex-col justify-between relative overflow-x-hidden transition-colors duration-300 font-sans">
      {/* Pinned Futuristic AI Holographic HUD Side Panels (Desktop) */}
      <AiHolographicSides />

      {/* Side Ambient Light Beams (GPU accelerated CSS breathing on screen edges) */}
      <div className="fixed top-0 left-0 w-1 sm:w-1.5 h-full bg-gradient-to-b from-indigo-500/0 via-indigo-500/35 to-purple-500/0 animate-light-beam pointer-events-none z-30" />
      <div className="fixed top-0 right-0 w-1 sm:w-1.5 h-full bg-gradient-to-b from-cyan-500/0 via-cyan-500/35 to-indigo-500/0 animate-light-beam pointer-events-none z-30" style={{ animationDelay: '4s' }} />

      {/* Floating Ambient Glowing Blobs on Sides */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none animate-blob-slow z-0" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-600/15 rounded-full blur-[130px] pointer-events-none animate-blob-reverse z-0" />
      <div className="fixed -bottom-40 left-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[130px] pointer-events-none animate-blob-slow z-0" style={{ animationDelay: '7s' }} />

      {/* Dynamic Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-600/15 dark:via-purple-600/10 dark:to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[1400px] right-0 w-[500px] h-[500px] bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[2800px] left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* =========================================================================
          Sticky Glassmorphic Header Navigation
         ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#070b14]/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand Name */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Adsetspro<span className="text-indigo-600 dark:text-indigo-400">flow</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium tracking-wider uppercase -mt-0.5">
                Startup OS
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-zinc-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
              Manage Projects
            </a>
            <a href="#planning" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
              Plan Smarter
            </a>
            <a href="#ai-features" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
              AI Features
            </a>
            <a href="#faqs" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
              FAQs
            </a>
          </nav>

          {/* Action Cluster */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />

            {currentUser ? (
              <>
                <Link
                  href={dashboardUrl}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">My Workspace</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-all cursor-pointer shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Book a Demo</span>
            </button>

            <Link
              href="/register"
              className="btn-shine px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>
                <span className="hidden sm:inline">Register Your Company</span>
                <span className="sm:hidden">Register</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION
         ========================================================================= */}
      <section className="relative z-10 pt-14 pb-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        {/* Interactive Neural Synapse Particle Network Background */}
        <AiNeuralCanvas particleCount={50} className="opacity-70 dark:opacity-85" />

        <div className="max-w-4xl mx-auto space-y-7 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <span>Next-Gen Project Management Built for Modern Teams</span>
          </div>

          {/* H1 Tag */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Project Management tool{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-400">
              built for your startup team
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 dark:text-zinc-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Bring your entire workflow together in one workspace. Manage tasks, collaborate on documents,
            track project timelines, and let AI simplify your work from start to finish.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <Link
              href={currentUser ? dashboardUrl : '/register'}
              className="btn-shine w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/45 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>{currentUser ? 'Open Your Workspace' : 'Sign Up Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 text-slate-800 dark:text-zinc-200 text-sm font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Register Your Organization</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Instant setup in 60 seconds</span>
            </div>
          </div>
        </div>

        {/* Live Interactive AI Copilot Synthesizer */}
        <AiInteractiveTerminal />

        {/* =====================================================================
            Reference Image: Tool Dashboard (Hero Showcase)
           ===================================================================== */}
        <div className="mt-14 max-w-6xl mx-auto relative group">
          {/* Glowing Ambient Behind Preview */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-cyan-500/20 to-purple-500/20 rounded-3xl blur-2xl -z-10 transform group-hover:scale-102 transition-transform duration-500 opacity-70 dark:opacity-100" />

          {/* Browser Window Chrome with Neon Glow Border Pulse */}
          <div className="neon-border-pulse rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-950/90 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Window Header */}
            <div className="px-4 py-3 bg-slate-100/90 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="px-4 py-1 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>app.adsetsproflow.com/workspace/dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px] font-medium hidden sm:inline">Live Sync</span>
              </div>
            </div>

            {/* Tool Dashboard Image */}
            <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
              <img
                src="/images/tool_dashboard_preview.jpg"
                alt="Adsetspro Flow Tool Dashboard Preview"
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.01]"
              />

              {/* Floating Badge 1: Sprint Progress (GPU float animation) */}
              <div className="animate-float absolute bottom-4 left-4 sm:bottom-6 sm:left-6 px-3.5 py-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-700/80 shadow-2xl backdrop-blur-md flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  82%
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold tracking-wider">
                    Sprint Progress
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Core Launch Ahead of Schedule
                  </div>
                </div>
              </div>

              {/* Floating Badge 2: AI Optimization (GPU float delayed animation) */}
              <div className="animate-float-delayed absolute top-4 right-4 sm:top-6 sm:right-6 px-3.5 py-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-700/80 shadow-2xl backdrop-blur-md flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-500 animate-spin" style={{ animationDuration: '4s' }} />
                <div className="text-left">
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold tracking-wider">
                    AI Copilot
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Smart Task Breakdown Ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: Trusted by the best startups (Infinite Smooth Marquee)
         ========================================================================= */}
      <section className="py-12 border-y border-slate-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/30 backdrop-blur-md relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs uppercase font-extrabold tracking-widest text-slate-500 dark:text-zinc-400 mb-8">
            Trusted by the best startups: Startups Logo
          </p>

          {/* Marquee Wrapper with Gradient Edge Masks */}
          <div className="relative w-full overflow-hidden">
            {/* Left Gradient Edge Mask */}
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-slate-50 dark:from-[#070b14] to-transparent z-10 pointer-events-none" />
            {/* Right Gradient Edge Mask */}
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-slate-50 dark:from-[#070b14] to-transparent z-10 pointer-events-none" />

            {/* Seamless Infinite Looping Track */}
            <div className="animate-marquee flex items-center gap-6 py-2">
              {[...startupLogos, ...startupLogos, ...startupLogos, ...startupLogos].map((logo, idx) => {
                const Icon = logo.icon;
                return (
                  <div
                    key={`${logo.name}-${idx}`}
                    className="flex items-center justify-center gap-2.5 py-3 px-6 rounded-2xl bg-white/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group cursor-default shrink-0 transform hover:-translate-y-0.5"
                  >
                    <Icon className={`w-5 h-5 ${logo.color} transition-transform group-hover:scale-110`} />
                    <span className="font-bold text-sm tracking-tight text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors whitespace-nowrap">
                      {logo.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: Manage Projects, Scale Your Startup
         ========================================================================= */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Text & CTAs */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Scalable Organization</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Manage Projects, Scale Your Startup
            </h2>

            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 leading-relaxed">
              Adsetsproflow Simplifies project management with smart planning, organized tasks, real-time
              progress tracking, and AI-powered tools that help your team stay focused and finish work faster.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Zero-Latency Department Task Pipelines
                  </span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">
                    Organize work across Development, Design, and Content in isolated workspaces.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Real-time Progress &amp; Stopwatch Timers
                  </span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">
                    Track exact minutes per task with visual countdowns and deadline alerts.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Role Delegation &amp; Peer Reviews
                  </span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">
                    Seamless sign-offs between Team Leads, Company Admins, and Workers.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <Link
                href="/register"
                className="btn-shine inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Visual Card */}
          <div className="relative">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    Live Performance
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Startup Growth Velocity
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  +24% this sprint
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-xs text-slate-500 dark:text-zinc-400 block mb-1">
                    Tasks Finished
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">142</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                    98.4% On Time
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-xs text-slate-500 dark:text-zinc-400 block mb-1">
                    Hours Saved
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">18.5h</span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-1">
                    Via AI Copilot
                  </span>
                </div>
              </div>

              {/* Status Pipeline Preview with Live AI Telemetry */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                    Active Sprint Pipelines
                  </span>
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Auto-Balanced
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                          Design Landing Page V2
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        In Review
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                          Stripe Billing Integration
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        68% Synced
                      </span>
                    </div>
                    {/* Live Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                      <div className="animate-progress-shimmer bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                        WebP Studio Deliverables
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Completed 🏆</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: Plan Smarter. Get Work Done Faster.
         ========================================================================= */}
      <section id="planning" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Reference Image */}
          <div className="order-2 lg:order-1 relative group">
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden">
              <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                <img
                  src="/images/smart_task_planning.jpg"
                  alt="Plan Smarter. Get Work Done Faster - Smart Task Planning"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="animate-float absolute top-4 left-4 px-3.5 py-2 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-700/80 text-xs font-bold text-slate-900 dark:text-white backdrop-blur-md shadow-xl flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                  </div>
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Gantt Milestones &amp; Live Deadlines</span>
                </div>

                <div className="animate-float-delayed absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold backdrop-blur-md shadow-xl flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '5s' }} />
                  <span>AI Schedulers: Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Text & CTAs */}
          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Intelligent Execution</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Plan Smarter. Get Work Done Faster.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 leading-relaxed">
              Organize tasks, assign responsibilities, and set deadlines in seconds. Adsetspro Flow keeps
              your projects structured and your team aligned, helping you move from planning to completion with ease.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  Drag-and-drop Kanban and sticky column table views
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  One-click employee task assignments with smart skill matching
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  Instant visual urgency cues for tasks due within 1 hour
                </span>
              </div>
            </div>

            <div className="pt-3">
              <Link
                href="/register"
                className="btn-shine inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all cursor-pointer"
              >
                <span>Sign Up Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: AI-Powered features to Drive Your Startup’s Growth
         ========================================================================= */}
      <section id="ai-features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 overflow-hidden">
        {/* Background Synaptic Particle Net */}
        <AiNeuralCanvas particleCount={30} className="opacity-35 dark:opacity-50" />

        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Built-in Intelligence</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            AI-Powered features to Drive Your Startup’s Growth
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            Automate mundane overhead, empower your team with immediate clarity, and execute at peak velocity.
          </p>
        </div>

        {/* Reference Image Showcase */}
        <div className="mb-14 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden relative group">
          <div className="relative aspect-[21/9] w-full bg-slate-950 overflow-hidden">
            <img
              src="/images/ai_growth_features.jpg"
              alt="AI-Powered Features Showcase"
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
            />
          </div>
        </div>

        {/* 4 Feature Cards Grid with Live AI Micro-Demonstrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. AI Assistance */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/20 transform hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  1. AI Assistance
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mt-1">
                  Get smart suggestions, automate routine work, and complete tasks faster with AI.
                </p>
              </div>

              {/* Live AI Interactive Micro-Widget */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-zinc-800 text-[11px] font-mono space-y-1.5 overflow-hidden relative">
                <div className="animate-laser-scan opacity-40" />
                <div className="text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Synthesizing Sprint Scope...</span>
                </div>
                <div className="text-slate-800 dark:text-zinc-200 font-bold flex items-center gap-1">
                  <span className="text-indigo-500">✨</span>
                  <span>4 subtasks &amp; test criteria created</span>
                </div>
              </div>
            </div>
            <div className="pt-5">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                <span>Enhance Descriptions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* 2. Team Chat */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-500 shadow-sm hover:shadow-2xl hover:shadow-purple-500/20 transform hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  2. Team Chat
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mt-1">
                  Communicate instantly, share updates, and keep your team connected in one place.
                </p>
              </div>

              {/* Live Chat Bubbles & Animated Typing Indicator */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-zinc-800 text-[11px] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-[9px] flex items-center justify-center">
                    JD
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 shadow-2xs text-[10px]">
                    Stripe webhooks deployed 🚀
                  </div>
                </div>
                <div className="flex items-center justify-between pl-7 text-[10px] text-slate-400 dark:text-zinc-500">
                  <span className="flex items-center gap-1 font-mono">
                    <span>AI Copilot typing</span>
                    <span className="inline-flex gap-0.5 ml-1">
                      <span className="w-1 h-1 rounded-full bg-purple-500 animate-typing-1" />
                      <span className="w-1 h-1 rounded-full bg-purple-500 animate-typing-2" />
                      <span className="w-1 h-1 rounded-full bg-purple-500 animate-typing-3" />
                    </span>
                  </span>
                  <span className="text-emerald-500 font-bold">100% Sync</span>
                </div>
              </div>
            </div>
            <div className="pt-5">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                <span>Direct &amp; Group Channels</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* 3. Smart Analytics */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-cyan-400 dark:hover:border-cyan-500 shadow-sm hover:shadow-2xl hover:shadow-cyan-500/20 transform hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  3. Smart Analytics
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mt-1">
                  Track project performance, monitor progress, and make data-driven decisions.
                </p>
              </div>

              {/* Live Animated Chart Bars */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-zinc-800 text-[11px] space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                    Velocity Velocity
                  </span>
                  <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400">+34.8% Faster</span>
                </div>
                <div className="h-9 flex items-end justify-between gap-1.5 px-1 pb-1">
                  <div className="flex-1 bg-cyan-500/20 rounded-md h-[40%] transition-all" />
                  <div className="flex-1 bg-cyan-500/40 rounded-md h-[65%] transition-all" />
                  <div className="flex-1 bg-cyan-500/60 rounded-md h-[55%] transition-all" />
                  <div className="flex-1 bg-gradient-to-t from-cyan-500 to-indigo-500 rounded-md h-[95%] animate-pulse" />
                </div>
              </div>
            </div>
            <div className="pt-5">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                <span>Velocity &amp; Telemetry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* 4. Smart Task Management */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/20 transform hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  4. Smart Task Management
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mt-1">
                  Organize tasks, set priorities, assign responsibilities, and meet deadlines with ease.
                </p>
              </div>

              {/* Live Kanban Urgency Task & Progress Shimmer */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-zinc-800 text-[11px] space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-800 dark:text-zinc-200">Landing V2 Launch</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold text-[9px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Due in 45m
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="animate-progress-shimmer bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: '85%' }}
                  />
                </div>
              </div>
            </div>
            <div className="pt-5">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                <span>Auto Schedulers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FAQs (Accordion)
         ========================================================================= */}
      <section id="faqs" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-400">
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Adsetsproflow Project Management Tool FAQs
          </h2>
          <p className="text-base text-slate-600 dark:text-zinc-400 max-w-xl mx-auto">
            Everything you need to know about getting started and scaling with Adsetspro Flow.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.q}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden relative ${
                  isOpen
                    ? 'border-indigo-400 dark:border-indigo-500/80 bg-white dark:bg-zinc-900 shadow-xl shadow-indigo-500/10'
                    : 'border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* Left Accent Glow line when open */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-cyan-400 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full px-6 py-4.5 text-left font-bold text-base text-slate-900 dark:text-zinc-100 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <span className={`transition-colors duration-200 ${isOpen ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : ''}`}>
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOpen
                        ? 'rotate-180 bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                  </div>
                </button>

                {/* Animated Smooth Accordion Dropdown Wrapper */}
                <div
                  className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 pt-2 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed border-t border-slate-100 dark:border-zinc-800/60 bg-gradient-to-b from-indigo-50/30 to-transparent dark:from-indigo-950/20 dark:to-transparent">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: Bottom High-Conversion Banner CTA (Flagship AI Banner)
         ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative z-10">
        {/* Animated Conic Border Runner Shell */}
        <div className="conic-border-wrapper p-[2px] shadow-2xl group">
          {/* Rotating Conic Light Beam Behind Border */}
          <div className="conic-border-glow" />

          {/* Deep Glassmorphic Content Card */}
          <div className="rounded-[1.4rem] bg-[#080d1a] text-white p-8 sm:p-16 text-center relative overflow-hidden">
            {/* Dynamic Moving Aurora Background Mesh */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-600/30 rounded-full blur-[100px] pointer-events-none animate-aurora" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-500/25 rounded-full blur-[100px] pointer-events-none animate-aurora" style={{ animationDelay: '4s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-[130px] pointer-events-none" />

            {/* Floating Left Holographic Badge (Desktop) */}
            <div className="hidden lg:flex animate-float absolute top-8 left-8 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-indigo-200 items-center gap-2 shadow-xl">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>1-Click Instant Demo</span>
            </div>

            {/* Floating Right Holographic Badge (Desktop) */}
            <div className="hidden lg:flex animate-float-delayed absolute bottom-8 right-8 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-emerald-300 items-center gap-2 shadow-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SOC2 Type II Certified</span>
            </div>

            {/* Center Content */}
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Next-Gen AI Workspace OS</span>
              </div>

              {/* H2 Title with Multi-Color Gradient */}
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
                Start building with{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-300 to-purple-300">
                  Adsetspro Flow
                </span>{' '}
                today.
              </h2>

              <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed">
                Join high-velocity teams orchestrating projects with smart planning, AI assistance, and seamless collaboration.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link
                  href="/register"
                  className="btn-shine w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-indigo-950 hover:bg-zinc-100 text-sm font-extrabold shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Sign Up Now</span>
                  <ArrowRight className="w-4 h-4 text-indigo-600 transition-transform group-hover:translate-x-1" />
                </Link>

                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-400/40 text-white text-sm font-extrabold backdrop-blur-md transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <Calendar className="w-4 h-4 text-indigo-300" />
                  <span>Book a Demo</span>
                </button>
              </div>

              {/* Micro-Trust Highlights */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Free 14-day trial
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Instant setup in 60s
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER (Flagship Multi-Column Modern SaaS Footer)
         ========================================================================= */}
      <footer className="relative z-10 bg-white/90 dark:bg-[#060a12]/95 backdrop-blur-2xl border-t border-slate-200/90 dark:border-zinc-800/90 transition-colors pt-16 pb-12 overflow-hidden">
        {/* Subtle Gradient Glow Divider Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/60 via-cyan-400/60 to-transparent" />

        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-48 bg-gradient-to-b from-indigo-500/5 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
            {/* Col 1: Brand & Mission (Spans 2 cols on lg) */}
            <div className="lg:col-span-2 space-y-5">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                    Adsetspro<span className="text-indigo-600 dark:text-indigo-400">flow</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium tracking-wider uppercase -mt-0.5">
                    Startup Project Management OS
                  </span>
                </div>
              </Link>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-sm">
                The all-in-one project management tool built for modern startups and growing teams. Bring tasks, AI assistance, team chat, and smart progress analytics together in one cohesive workspace.
              </p>

              {/* Live Operational Status Pill */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>All Systems Operational • 99.98% Uptime</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Product
              </h3>
              <ul className="space-y-2.5 text-xs font-medium text-slate-600 dark:text-zinc-400">
                <li>
                  <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-150">
                    Manage Projects
                  </a>
                </li>
                <li>
                  <a href="#planning" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-150">
                    Plan Smarter (Kanban)
                  </a>
                </li>
                <li>
                  <a href="#ai-features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-150">
                    AI Copilot Features
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsDemoModalOpen(true)}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-150 cursor-pointer text-left"
                  >
                    Instant 1-Click Demo
                  </button>
                </li>
                <li>
                  <Link href="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-150">
                    Register Your Organization
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Resources
              </h3>
              <ul className="space-y-2.5 text-xs font-medium text-slate-600 dark:text-zinc-400">
                <li>
                  <a href="#faqs" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-150">
                    Frequently Asked Questions
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-150">
                    Sign In to Workspace
                  </Link>
                </li>
                <li>
                  <span className="text-slate-400 dark:text-zinc-600 cursor-not-allowed">
                    WebP Compression Studio
                  </span>
                </li>
                <li>
                  <span className="text-slate-400 dark:text-zinc-600 cursor-not-allowed">
                    Developer API Docs
                  </span>
                </li>
                <li>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                    v2.6 Release Active
                  </span>
                </li>
              </ul>
            </div>

            {/* Col 4: Company & Legal */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Company &amp; Legal
              </h3>
              <ul className="space-y-2.5 text-xs font-medium text-slate-600 dark:text-zinc-400">
                <li>
                  <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-150">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-150">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>SOC2 Type II Ready</span>
                  </span>
                </li>
                <li>
                  <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>GDPR Compliant</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Architecture */}
          <div className="border-t border-slate-200/80 dark:border-zinc-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-400 pr-16 sm:pr-24">
            <div className="flex items-center gap-2">
              <span>© 2026 Adsetspro Flow Inc. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Next-Gen Startup Architecture</span>
              </span>
              <span className="text-slate-300 dark:text-zinc-700">|</span>
              <span className="text-slate-500 dark:text-zinc-500">
                Engineered for Velocity
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          INTERACTIVE "BOOK A DEMO" & INSTANT 1-CLICK DEMO MODAL
         ========================================================================= */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl relative max-h-[92vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setIsDemoModalOpen(false);
                setDemoLaunchError(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer z-10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1.5 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Interactive Demo</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Experience Adsetspro Flow
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                Launch directly into a live, pre-seeded startup workspace. Select a role below to explore features with zero signup or setup required.
              </p>
            </div>

            {/* Error Message if Demo Launch Fails */}
            {demoLaunchError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                {demoLaunchError}
              </div>
            )}

            {/* INSTANT 1-CLICK DEMO ROLES */}
            <div className="space-y-3.5">
              {/* Role 1: Company Admin */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Company Admin
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Manage task pipelines, assign team work, review deliverables, and view company velocity.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isDemoLaunching !== null}
                  onClick={() => handleInstantLaunch('admin')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isDemoLaunching === 'admin' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Launching...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Admin Demo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Role 2: Team Member / Employee */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Team Member / Worker
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold">
                        Daily Flow
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Focused task queue, stopwatch timers, WebP compression studio, and real-time team chat.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isDemoLaunching !== null}
                  onClick={() => handleInstantLaunch('employee')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white text-xs font-bold border border-slate-700 dark:border-zinc-700 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isDemoLaunching === 'employee' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Launching...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Member Demo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-500 dark:text-zinc-500 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Instant access • No email or credit card required • 100% Sandbox safe</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FLOATING TOP-TO-GO (SCROLL PROGRESS CIRCLE + BACK TO TOP) BUTTON
         ========================================================================= */}
      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 transform ${
          showScrollTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={scrollToTop}
          title={`Scroll to top (${Math.round(scrollProgress * 100)}% scrolled)`}
          aria-label="Scroll back to top"
          className="relative w-12 h-12 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 shadow-2xl backdrop-blur-md text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500/80 hover:shadow-indigo-500/25 transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer group flex items-center justify-center"
        >
          {/* Animated Circular SVG Progress Bar */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"
            viewBox="0 0 48 48"
          >
            {/* Background Track Ring */}
            <circle
              cx="24"
              cy="24"
              r="20"
              className="stroke-slate-200 dark:stroke-zinc-800/80 fill-none"
              strokeWidth="2.5"
            />
            {/* Animated Dynamic Progress Ring */}
            <circle
              cx="24"
              cy="24"
              r="20"
              className="stroke-indigo-600 dark:stroke-indigo-400 fill-none transition-[stroke-dashoffset] duration-150 ease-out"
              strokeWidth="2.5"
              strokeDasharray={125.66}
              strokeDashoffset={125.66 - scrollProgress * 125.66}
              strokeLinecap="round"
            />
          </svg>

          {/* Center Arrow Icon */}
          <ArrowUp className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 relative z-10" />
        </button>
      </div>
    </div>
  );
}
