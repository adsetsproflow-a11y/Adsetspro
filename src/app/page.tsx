'use client';



import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import dynamic from 'next/dynamic';

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

import AiHolographicSides from '@/components/landing/AiHolographicSides';

import ClickUpSpeedStreaks from '@/components/landing/ClickUpSpeedStreaks';
import MagneticHeroCore from '@/components/landing/MagneticHeroCore';

import ClickUpBrainSection from '@/components/landing/ClickUpBrainSection';

import AiInteractiveFeaturesShowcase from '@/components/landing/AiInteractiveFeaturesShowcase';

import LandingClosing from '@/components/landing/LandingClosing';
import PlanSmarterShowcase from '@/components/landing/PlanSmarterShowcase';
import ScrollReveal from '@/components/landing/ScrollReveal';
import CountUp from '@/components/landing/CountUp';
import SectionAmbience from '@/components/landing/SectionAmbience';



// High-performance dynamic code splitting for below-the-fold & non-critical interactive widgets

const AiNeuralCanvas = dynamic(() => import('@/components/landing/AiNeuralCanvas'), {

  ssr: false,

  loading: () => <div className="absolute inset-0 pointer-events-none" />,

});



const DemoModal = dynamic(() => import('@/components/landing/DemoModal'), {

  ssr: false,

});



const BackToTop = dynamic(() => import('@/components/landing/BackToTop'), {

  ssr: false,

});



export default function HomePage() {

  const [currentUser, setCurrentUser] = useState<{

    id: string;

    email: string;

    full_name?: string;

    is_super_admin?: boolean;

    companySlug?: string;

  } | null>(null);



  // FAQ open state




  // Demo modal state

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);



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

        } catch { }

      }

    }

  }, []);



  const handleLogout = async () => {

    try {

      await fetch('/api/auth/logout', { method: 'POST' });

    } catch { }

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

    <div className="dark min-h-screen bg-[#070b14] bg-grid-pattern text-zinc-100 flex flex-col justify-between relative overflow-x-hidden font-sans">

      {/* Pinned Futuristic AI Holographic HUD Side Panels (Desktop) */}

      <AiHolographicSides />



      {/* Side Ambient Light Beams (GPU accelerated CSS breathing on screen edges) */}

      <div className="fixed top-0 left-0 w-1 sm:w-1.5 h-full bg-gradient-to-b from-indigo-500/0 via-indigo-500/35 to-purple-500/0 animate-light-beam pointer-events-none z-30" />

      <div className="fixed top-0 right-0 w-1 sm:w-1.5 h-full bg-gradient-to-b from-cyan-500/0 via-cyan-500/35 to-indigo-500/0 animate-light-beam pointer-events-none z-30" style={{ animationDelay: '4s' }} />



      {/* Floating Ambient Glowing Blobs on Sides */}

      <div className="fixed -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none animate-blob-slow z-0" />

      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-[130px] pointer-events-none animate-blob-reverse z-0" />

      <div className="fixed -bottom-40 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[130px] pointer-events-none animate-blob-slow z-0" style={{ animationDelay: '7s' }} />



      {/* Dynamic Background Ambient Glows */}

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="absolute top-[1400px] right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="absolute top-[2800px] left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />



      {/* =========================================================================

          Sticky Glassmorphic Header Navigation (Strictly Dark Mode)

         ========================================================================= */}

      <header className="hp-header sticky top-0 z-50 bg-[#070914]/70 backdrop-blur-2xl backdrop-saturate-150 px-4 sm:px-8 py-3 transition-colors">

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Logo & Brand Name */}

          <Link href="/" className="flex items-center gap-3 group">

            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden flex items-center justify-center ring-1 ring-white/10 bg-white/[0.04] shadow-[0_0_20px_-4px_rgba(34,211,238,0.5)] group-hover:scale-105 transition-transform duration-300 shrink-0">

              <img

                src="/images/adsetspro-logo.webp"

                alt="Adsetspro Flow Logo"

                className="w-full h-full object-contain scale-[1.65]"

              />

            </div>

            <div className="flex items-center">

              <span className="font-bold text-lg sm:text-xl tracking-tight text-white">

                Adsetspro<span className="text-cyan-400">flow</span>

              </span>

            </div>

          </Link>



          {/* Center Navigation Links (Hidden on mobile) */}

          <nav className="hp-nav hidden md:flex items-center gap-1 rounded-full p-1 text-[13px] font-medium text-white">

            <a href="#features" className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/[0.06] transition-all duration-200">

              Manage Projects

            </a>

            <a href="#planning" className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/[0.06] transition-all duration-200">

              Plan Smarter

            </a>

            <a href="#ai-features" className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/[0.06] transition-all duration-200">

              AI Features

            </a>

            <a href="#faqs" className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/[0.06] transition-all duration-200">

              FAQs

            </a>

          </nav>



          {/* Action Cluster (Landing locked to Dark Mode; theme toggle available inside Workspaces) */}

          <div className="flex items-center gap-2.5 sm:gap-3">

            {currentUser ? (

              <>

                <Link

                  href={dashboardUrl}

                  className="px-3.5 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/10 text-[13px] font-medium text-zinc-200 transition-colors inline-flex items-center gap-1.5"

                >

                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />

                  <span className="hidden sm:inline">My Workspace</span>

                </Link>

                <button

                  onClick={handleLogout}

                  className="px-2.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1 cursor-pointer"

                  title="Sign Out"

                >

                  <LogOut className="w-3.5 h-3.5" />

                  <span className="hidden sm:inline">Sign Out</span>

                </button>

              </>

            ) : (

              <Link

                href="/login"

                className="px-3.5 py-2 rounded-full text-[13px] font-medium text-zinc-300 hover:text-white transition-colors"

              >

                Sign In

              </Link>

            )}



            <button

              onClick={() => setIsDemoModalOpen(true)}

              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.03] ring-1 ring-white/10 hover:ring-white/25 hover:bg-white/[0.07] text-[13px] font-medium text-zinc-200 transition-all cursor-pointer"

            >

              <Calendar className="w-3.5 h-3.5 text-sky-300" />

              <span>Book a Demo</span>

            </button>



            <Link

              href="/register"

              className="hp-btn-primary group btn-shine px-4 py-2 rounded-full text-white text-[13px] font-semibold transition-all cursor-pointer flex items-center gap-1"

            >

              <span>Sign Up Now</span>

              <ArrowRight className="w-3.5 h-3.5" />

            </Link>

          </div>

        </div>

      </header>



      {/* =========================================================================

          HERO SECTION

         ========================================================================= */}

      <section className="relative z-10 pt-14 pb-20 text-center overflow-hidden w-full">

        {/* Interactive Neural Synapse Particle Network Background */}

        <AiNeuralCanvas particleCount={50} className="opacity-70 dark:opacity-85" />



        <div className="max-w-4xl mx-auto space-y-7 relative z-10 px-4 sm:px-6 lg:px-8">

          {/* Badge */}

          <div className="hp-in hp-badge relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-zinc-200 text-xs font-medium overflow-hidden" style={{ animationDelay: '0ms' }}>

            <Sparkles className="w-3.5 h-3.5 text-teal-300" />

            <span>Next-Gen Project Management Built for Modern Teams</span>

          </div>



          {/* H1 Tag */}

          <h1 className="hp-in text-4xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.035em] text-white leading-[1.04]" style={{ animationDelay: '90ms' }}>

            Project Management tool{' '}

            <span className="hp-shimmer bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-sky-400 to-indigo-400">

              built for your startup team

            </span>

          </h1>



          {/* Subtitle */}

          <p className="hp-in text-base sm:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed font-normal" style={{ animationDelay: '180ms' }}>

            Bring your entire workflow together in one workspace. Manage tasks, collaborate on documents,

            track project timelines, and let AI simplify your work from start to finish.

          </p>



          {/* CTA Buttons */}

          <div className="hp-in flex flex-col sm:flex-row items-center justify-center gap-3 pt-3" style={{ animationDelay: '270ms' }}>

            <Link

              href={currentUser ? dashboardUrl : '/register'}

              className="hp-btn-primary group btn-shine w-full sm:w-auto px-7 py-3.5 rounded-full text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"

            >

              <span>{currentUser ? 'Open Your Workspace' : 'Sign Up Now'}</span>

              <ArrowRight className="w-4 h-4" />

            </Link>



            <button

              type="button"

              onClick={() => setIsDemoModalOpen(true)}

              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white/[0.04] ring-1 ring-white/15 hover:ring-white/30 hover:bg-white/[0.08] backdrop-blur-md text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"

            >

              <Calendar className="w-4 h-4 text-sky-300" />

              <span>Book a Demo</span>

            </button>

          </div>





        </div>



        {/* =====================================================================

            Reference Image: Tool Dashboard (Hero Showcase with ClickUp-style Speed Streaks)

           ===================================================================== */}

        <div className="mt-12 relative group">

          {/* ClickUp-style Laser Speed Streaks & Cosmic Energy Trails (Left & Right Wings) */}

          <ClickUpSpeedStreaks />



          {/* Magnetic Hero Core Wrapper: 3D Orbit Rings, Particle Ribbon Flux, Tilt & Frame */}

          <MagneticHeroCore>

            {/* Browser Window Chrome with Neon Glow Border Pulse */}

          <div className="bg-white/95 dark:bg-zinc-950/95 overflow-hidden">

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

          </MagneticHeroCore>

        </div>

      </section>



      {/* =========================================================================

          CLICKUP BRAIN STYLE: AI PRODUCTIVITY PARTNER TRILOGY

         ========================================================================= */}

      <ScrollReveal />

      <ClickUpBrainSection />



      {/* =========================================================================

          SECTION 2: Trusted by the best startups (Infinite Smooth Marquee)

         ========================================================================= */}

      <section className="hp-logos py-16 sm:py-20 relative z-10 overflow-hidden">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">

          <p data-reveal="up" className="flex items-center justify-center gap-3 sm:gap-5 text-[11px] sm:text-xs uppercase font-semibold tracking-[0.22em] text-zinc-300 mb-10 sm:mb-12"><span aria-hidden className="hidden sm:block h-px w-20 bg-gradient-to-r from-transparent via-teal-400/60 to-sky-400" /><span aria-hidden className="hidden sm:block w-1.5 h-1.5 rounded-full bg-teal-300 shadow-[0_0_10px_#2dd4bf]" />

            Trusted by the best startups: Startups Logo

          <span aria-hidden className="hidden sm:block w-1.5 h-1.5 rounded-full bg-indigo-300 shadow-[0_0_10px_#818cf8]" /><span aria-hidden className="hidden sm:block h-px w-20 bg-gradient-to-l from-transparent via-indigo-400/60 to-sky-400" /></p>



          {/* Marquee Wrapper with Gradient Edge Masks */}

          <div data-reveal="up" style={{ ['--rd' as string]: '120ms' }} className="hp-marquee-mask relative w-full overflow-hidden">

            {/* Left Gradient Edge Mask */}

            

            {/* Right Gradient Edge Mask */}

            



            {/* Seamless Infinite Looping Track */}

            <div className="animate-marquee flex items-center gap-3 sm:gap-4 py-2">

              {[...startupLogos, ...startupLogos, ...startupLogos, ...startupLogos].map((logo, idx) => {

                const Icon = logo.icon;

                return (

                  <div

                    key={`${logo.name}-${idx}`}

                    className="hp-logo-chip flex items-center justify-center gap-3 py-3 px-5 sm:py-3.5 sm:px-7 rounded-2xl transition-all duration-300 group cursor-default shrink-0 hover:-translate-y-1"

                  >

                    <span className="hp-logo-icon w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"><Icon className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${logo.color}`} /></span>

                    <span className="font-semibold text-sm sm:text-[15px] tracking-tight text-zinc-100 group-hover:text-white transition-colors whitespace-nowrap">

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

        <SectionAmbience focus="right" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left Text & CTAs */}

          <div data-reveal="left" className="space-y-6">

            <div className="hp-chip inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-zinc-200 text-xs font-medium">

              <TrendingUp className="w-3.5 h-3.5 text-teal-300" />

              <span>Scalable Organization</span>

            </div>



            <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white leading-[1.08]">

              Manage Projects,{' '}<span className="hp-shimmer bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-sky-400 to-indigo-400">Scale Your Startup</span>

            </h2>



            <p className="text-base sm:text-lg text-white/75 leading-relaxed">

              Adsetsproflow Simplifies project management with smart planning, organized tasks, real-time

              progress tracking, and AI-powered tools that help your team stay focused and finish work faster.

            </p>



            <div className="space-y-4 pt-2">

              <div data-reveal="up" style={{ ['--rd' as string]: '250ms' }} className="flex items-start gap-3">

                <div className="w-6 h-6 rounded-full bg-teal-400/10 ring-1 ring-teal-400/30 text-teal-300 flex items-center justify-center shrink-0">

                  <Check className="w-3.5 h-3.5 stroke-[3]" />

                </div>

                <div>

                  <span className="text-[15px] font-semibold text-white block">

                    Zero-Latency Department Task Pipelines

                  </span>

                  <span className="text-[13px] text-white/60">

                    Organize work across Development, Design, and Content in isolated workspaces.

                  </span>

                </div>

              </div>



              <div data-reveal="up" style={{ ['--rd' as string]: '360ms' }} className="flex items-start gap-3">

                <div className="w-6 h-6 rounded-full bg-sky-400/10 ring-1 ring-sky-400/30 text-sky-300 flex items-center justify-center shrink-0">

                  <Check className="w-3.5 h-3.5 stroke-[3]" />

                </div>

                <div>

                  <span className="text-[15px] font-semibold text-white block">

                    Real-time Progress &amp; Stopwatch Timers

                  </span>

                  <span className="text-[13px] text-white/60">

                    Track exact minutes per task with visual countdowns and deadline alerts.

                  </span>

                </div>

              </div>



              <div data-reveal="up" style={{ ['--rd' as string]: '470ms' }} className="flex items-start gap-3">

                <div className="w-6 h-6 rounded-full bg-indigo-400/10 ring-1 ring-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">

                  <Check className="w-3.5 h-3.5 stroke-[3]" />

                </div>

                <div>

                  <span className="text-[15px] font-semibold text-white block">

                    Role Delegation &amp; Peer Reviews

                  </span>

                  <span className="text-[13px] text-white/60">

                    Seamless sign-offs between Team Leads, Company Admins, and Workers.

                  </span>

                </div>

              </div>

            </div>



            <div className="pt-3">

              <Link

                href="/register"

                className="hp-btn-primary btn-shine inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white text-sm font-semibold transition-all hover:-translate-y-0.5 cursor-pointer"

              >

                <span>Get Started</span>

                <ArrowRight className="w-4 h-4" />

              </Link>

            </div>

          </div>



          {/* Right Visual Card */}

          <div data-reveal="right" style={{ ['--rd' as string]: '150ms' }} className="relative">

            <div className="hp-glass hp-float-slow p-6 sm:p-8 rounded-[28px] space-y-6 hover:-translate-y-1 transition-all duration-500">

              <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">

                <div>

                  <span className="text-[11px] font-semibold text-teal-300 uppercase tracking-[0.18em] block mb-1">

                    Live Performance

                  </span>

                  <h3 className="text-xl font-semibold tracking-tight text-white">

                    Startup Growth Velocity

                  </h3>

                </div>

                <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/25 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">

                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />

                  +24% this sprint

                </span>

              </div>



              <div className="grid grid-cols-2 gap-4">

                <div data-reveal="zoom" style={{ ['--rd' as string]: '350ms' }} className="p-4 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07]">

                  <span className="text-xs text-slate-500 dark:text-zinc-400 block mb-1">

                    Tasks Finished

                  </span>

                  <span className="text-3xl font-bold tracking-tight text-white"><CountUp to={142} /></span>

                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">

                    98.4% On Time

                  </span>

                </div>



                <div data-reveal="zoom" style={{ ['--rd' as string]: '470ms' }} className="p-4 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07]">

                  <span className="text-xs text-slate-500 dark:text-zinc-400 block mb-1">

                    Hours Saved

                  </span>

                  <span className="text-3xl font-bold tracking-tight text-white"><CountUp to={18.5} decimals={1} suffix="h" /></span>

                  <span className="text-[11px] text-sky-300 font-semibold block mt-1">

                    Via AI Copilot

                  </span>

                </div>

              </div>



              {/* Status Pipeline Preview with Live AI Telemetry */}

              <div className="space-y-3">

                <div className="flex items-center justify-between">

                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.18em] block">

                    Active Sprint Pipelines

                  </span>

                  <span className="text-[10px] font-mono text-teal-300 font-semibold flex items-center gap-1">

                    <Sparkles className="w-3 h-3" />

                    AI Auto-Balanced

                  </span>

                </div>



                <div className="space-y-2.5">

                  <div data-reveal="right" style={{ ['--rd' as string]: '550ms' }} className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07] hover:ring-white/[0.14] transition-all">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2.5">

                        <span className="relative flex h-2 w-2">

                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />

                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />

                        </span>

                        <span className="text-[13px] font-medium text-zinc-100">

                          Design Landing Page V2

                        </span>

                      </div>

                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/25">

                        In Review

                      </span>

                    </div>

                  </div>



                  <div data-reveal="right" style={{ ['--rd' as string]: '680ms' }} className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07] hover:ring-white/[0.14] transition-all">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2.5">

                        <span className="relative flex h-2 w-2">

                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />

                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />

                        </span>

                        <span className="text-[13px] font-medium text-zinc-100">

                          Stripe Billing Integration

                        </span>

                      </div>

                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-400/10 text-indigo-300 ring-1 ring-indigo-400/25">

                        68% Synced

                      </span>

                    </div>

                    {/* Live Progress Bar */}

                    <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-1">

                      <div className="animate-progress-shimmer hp-fill bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-500 h-full rounded-full shadow-[0_0_12px_rgba(56,189,248,0.6)]" style={{ width: '68%' }} />

                    </div>

                  </div>



                  <div data-reveal="right" style={{ ['--rd' as string]: '810ms' }} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07] hover:ring-white/[0.14] transition-all">

                    <div className="flex items-center gap-2.5">

                      <span className="w-2 h-2 rounded-full bg-emerald-500" />

                      <span className="text-[13px] font-medium text-zinc-100">

                        WebP Studio Deliverables

                      </span>

                    </div>

                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/25 flex items-center gap-1">

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

      <PlanSmarterShowcase />



      {/* =========================================================================

          SECTION 5: AI-Powered features to Drive Your Startup’s Growth

         ========================================================================= */}

      <section id="ai-features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 overflow-hidden">

        {/* Background Synaptic Particle Net */}

        <AiNeuralCanvas particleCount={30} className="opacity-35 dark:opacity-50" />



        <div data-reveal="up" className="text-center max-w-3xl mx-auto space-y-4 mb-14 relative z-10">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">

            <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />

            <span>Built-in Intelligence</span>

          </div>



          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">

            AI-Powered features to Drive Your Startup’s Growth

          </h2>



          <p className="text-base sm:text-lg text-slate-600 dark:text-white/75">

            Automate mundane overhead, empower your team with immediate clarity, and execute at peak velocity.

          </p>

        </div>



        {/* Interactive Split Feature Showcase (Click on Left -> Display on Right) */}

        <div data-reveal="zoom" style={{ ['--rd' as string]: '120ms' }}>
          <AiInteractiveFeaturesShowcase />
        </div>

      </section>



      {/* FAQ + final CTA + footer */}

      <LandingClosing faqs={faqs} onBookDemo={() => setIsDemoModalOpen(true)} />



      {/* =========================================================================
          INTERACTIVE 'BOOK A DEMO' & INSTANT 1-CLICK DEMO MODAL (WITH LEAD CAPTURE)
         ========================================================================= */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />


      {/* =========================================================================

          FLOATING TOP-TO-GO (SCROLL PROGRESS CIRCLE + BACK TO TOP) BUTTON

         ========================================================================= */}

      <div

        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 transform ${showScrollTop

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

