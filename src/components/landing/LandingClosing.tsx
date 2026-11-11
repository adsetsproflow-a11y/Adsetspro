'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Plus, Sparkles, Zap, MessageCircleQuestion, ArrowUpRight } from 'lucide-react';
import SectionAmbience from './SectionAmbience';

// =============================================================================
// LANDING CLOSING: FAQ + final CTA + footer (premium, same content)
// =============================================================================

interface Faq {
  q: string;
  a: string;
}

interface LandingClosingProps {
  faqs: Faq[];
  onBookDemo: () => void;
}

/** Adds data-visible to the element once it scrolls into view. */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.dataset.visible = 'true';
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

// Splits "1. What is…" into { num: "01", text: "What is…" }
function splitQuestion(q: string) {
  const m = q.match(/^(\d+)\.\s*(.*)$/);
  return m ? { num: m[1].padStart(2, '0'), text: m[2] } : { num: '', text: q };
}

export default function LandingClosing({ faqs, onBookDemo }: LandingClosingProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqRef = useReveal<HTMLElement>();
  const ctaRef = useReveal<HTMLElement>();
  const footerRef = useReveal<HTMLElement>();
  const ctaCardRef = useRef<HTMLDivElement | null>(null);

  const onCtaMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ctaCardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const linkCls =
    'lc-link relative inline-flex items-center gap-1 text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-white/60 dark:hover:text-white';

  return (
    <div className="lc-root">
      {/* =====================================================================
          FAQ
         ===================================================================== */}
      <section
        id="faqs"
        ref={faqRef}
        className="lc-reveal relative z-10 mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8"
      >
        <SectionAmbience focus="right" />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          {/* Left: sticky intro */}
          <div className="lc-item lc-from-left space-y-5 lg:sticky lg:top-28 lg:self-start" style={{ '--d': '0ms' } as React.CSSProperties}>
            <div className="lc-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200">
              <MessageCircleQuestion className="h-3.5 w-3.5 text-violet-500 dark:text-violet-300" />
              Got Questions?
            </div>
            <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Adsetsproflow Project Management Tool{' '}
              <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent dark:from-violet-300 dark:via-fuchsia-300 dark:to-cyan-300">
                FAQs
              </span>
            </h2>
            <p className="max-w-md text-base leading-relaxed text-slate-600 dark:text-white/75">
              Everything you need to know about getting started and scaling with Adsetspro Flow.
            </p>

            <button
              type="button"
              onClick={onBookDemo}
              className="group inline-flex cursor-pointer items-center gap-3 rounded-2xl py-2 pl-2 pr-4 text-left ring-1 ring-slate-200 transition-all hover:ring-violet-400/50 dark:ring-white/10 dark:hover:bg-white/[0.03]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/30">
                <Calendar className="h-4 w-4" />
              </span>
              <span className="text-sm">
                <span className="block font-semibold text-slate-900 dark:text-white">Still curious?</span>
                <span className="block text-xs text-slate-500 dark:text-zinc-400">Book a Demo with our team</span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 dark:text-zinc-500" />
            </button>
          </div>

          {/* Right: accordion */}
          <div className="lc-item lc-from-right space-y-3" style={{ '--d': '150ms' } as React.CSSProperties}>
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              const { num, text } = splitQuestion(faq.q);
              const panelId = `faq-panel-${index}`;
              return (
                <div
                  key={faq.q}
                  className={`lc-faq lc-faq-in relative rounded-2xl ${isOpen ? 'is-open' : ''}`}
                  style={{ '--fi': index } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full cursor-pointer items-center gap-4 px-5 py-5 text-left sm:px-6"
                  >
                    {num && (
                      <span
                        className={`font-mono text-xs tabular-nums transition-colors duration-300 ${
                          isOpen ? 'text-violet-500 dark:text-violet-300' : 'text-slate-400 dark:text-zinc-600'
                        }`}
                      >
                        {num}
                      </span>
                    )}
                    <span
                      className={`flex-1 text-base font-semibold tracking-tight transition-colors duration-300 sm:text-[17px] ${
                        isOpen ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      {text}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                        isOpen
                          ? 'rotate-45 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_0_20px_-2px_rgba(168,85,247,0.7)]'
                          : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-white/[0.04] dark:text-zinc-400 dark:ring-white/10'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className={`px-5 pb-6 text-sm leading-relaxed text-slate-600 dark:text-white/60 sm:px-6 ${num ? 'sm:pl-[3.4rem]' : ''}`}>
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          FINAL CTA
         ===================================================================== */}
      <section ref={ctaRef} className="lc-reveal relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionAmbience focus="center" />
        <div
          ref={ctaCardRef}
          onMouseMove={onCtaMove}
          className="lc-item lc-zoom lc-cta relative rounded-[32px] p-px"
          style={{ '--d': '0ms' } as React.CSSProperties}
        >
          <div className="relative overflow-hidden rounded-[31px] bg-[#070915] px-6 py-16 text-center text-white sm:px-16 sm:py-24">
            {/* Background layers */}
            <div aria-hidden className="lc-cta-grid pointer-events-none absolute inset-0" />
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] max-w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(168,85,247,0.55),rgba(236,72,153,0.2),transparent)] blur-2xl" />
            <div aria-hidden className="lc-aurora pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-cyan-500/20 blur-[110px]" />
            <div aria-hidden className="lc-aurora pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-[110px]" style={{ animationDelay: '-5s' }} />
            <div aria-hidden className="lc-cta-spot pointer-events-none absolute inset-0" />
            {/* Top rim light */}
            <div aria-hidden className="pointer-events-none absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent shadow-[0_0_20px_2px_rgba(217,70,239,0.6)]" />

            <div className="relative z-10 mx-auto max-w-2xl space-y-7">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-zinc-200 ring-1 ring-white/10 backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
                  Next-Gen AI Workspace OS
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-zinc-200 ring-1 ring-white/10 backdrop-blur">
                  <Zap className="h-3.5 w-3.5 text-cyan-300" />
                  1-Click Instant Demo
                </span>
              </div>

              <h2 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Start building with{' '}
                <span className="lc-shimmer bg-gradient-to-r from-violet-300 via-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">
                  Adsetspro Flow
                </span>{' '}
                today.
              </h2>

              <p className="mx-auto max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                Join high-velocity teams orchestrating projects with smart planning, AI assistance, and seamless collaboration.
              </p>

              <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                <Link
                  href="/register"
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-950 shadow-[0_10px_40px_-10px_rgba(255,255,255,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_50px_-10px_rgba(217,70,239,0.8)] sm:w-auto"
                >
                  <span aria-hidden className="lc-btn-shine pointer-events-none absolute inset-0" />
                  <span>Sign Up Now</span>
                  <ArrowRight className="h-4 w-4 text-violet-600 transition-transform group-hover:translate-x-1" />
                </Link>
                <button
                  type="button"
                  onClick={onBookDemo}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white/[0.06] px-8 py-4 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.1] hover:ring-white/30 sm:w-auto"
                >
                  <Calendar className="h-4 w-4 text-violet-300" />
                  <span>Book a Demo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FOOTER
         ===================================================================== */}
      <footer ref={footerRef} className="lc-reveal relative z-10 mt-12 overflow-hidden">
        <SectionAmbience focus="left" />
        {/* Glowing divider */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
        <div aria-hidden className="absolute left-1/2 top-0 h-40 w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/15 blur-3xl" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(59,130,246,0.12),transparent)]" />

        <div className="mx-auto max-w-7xl px-4 pb-10 pt-20 sm:px-6 lg:px-8">
          <div className="lc-item grid gap-12 lg:grid-cols-12" style={{ '--d': '0ms' } as React.CSSProperties}>
            {/* Brand */}
            <div className="space-y-5 lg:col-span-5">
              <Link href="/" className="group inline-flex items-center gap-3">
                <span className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-slate-200 transition-transform duration-300 group-hover:scale-105 dark:ring-white/10">
                  <img src="/images/adsetspro-logo.webp" alt="Adsetspro Flow Logo" className="h-full w-full object-contain scale-[1.65]" />
                </span>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Adsetspro<span className="text-cyan-500 dark:text-cyan-400">flow</span>
                </span>
              </Link>
              <p className="max-w-sm text-sm leading-relaxed text-slate-600 dark:text-white/60">
                The all-in-one project management tool built for modern startups and growing teams. Bring tasks, AI assistance, team chat, and smart progress analytics together in one cohesive workspace.
              </p>
              <Link
                href="/register"
                className="group inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white/[0.06] dark:ring-1 dark:ring-white/10 dark:hover:bg-white/[0.1]"
              >
                Sign Up Now
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-7 lg:pl-10">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-900 dark:text-zinc-200">Product</h3>
                <ul className="space-y-3">
                  <li><a href="#features" className={linkCls}>Manage Projects</a></li>
                  <li><a href="#planning" className={linkCls}>Plan Smarter (Kanban)</a></li>
                  <li><a href="#ai-features" className={linkCls}>AI Copilot Features</a></li>
                  <li>
                    <button type="button" onClick={onBookDemo} className={`${linkCls} cursor-pointer text-left`}>
                      Instant 1-Click Demo
                    </button>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-900 dark:text-zinc-200">Resources</h3>
                <ul className="space-y-3">
                  <li><Link href="/pricing" className={linkCls}>Plans &amp; Pricing</Link></li>
                  <li><Link href="/contact" className={linkCls}>Contact Enterprise</Link></li>
                  <li><a href="#faqs" className={linkCls}>Frequently Asked Questions</a></li>
                  <li><Link href="/login" className={linkCls}>Sign In to Workspace</Link></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-900 dark:text-zinc-200">Company &amp; Legal</h3>
                <ul className="space-y-3">
                  <li><Link href="/privacy" className={linkCls}>Privacy Policy</Link></li>
                  <li><Link href="/terms" className={linkCls}>Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Big wordmark: an SVG so it always fits the container width exactly */}
          <svg
            aria-hidden
            className="pointer-events-none mt-14 block h-auto w-full select-none sm:mt-20"
            viewBox="0 0 1200 190"
            preserveAspectRatio="xMidYMax meet"
          >
            <defs>
              <linearGradient id="lc-wm-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="lc-wm-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <text
              x="600"
              y="170"
              textAnchor="middle"
              textLength="1190"
              lengthAdjust="spacingAndGlyphs"
              fontSize="210"
              fontWeight="900"
              letterSpacing="-6"
              fill="url(#lc-wm-fill)"
              stroke="url(#lc-wm-stroke)"
              strokeWidth="1"
              className="lc-wordmark-text"
            >
              Adsetsproflow
            </text>
          </svg>

          {/* Bottom bar */}
          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 dark:border-white/[0.06] dark:text-white/45 sm:flex-row sm:pr-20">
            <span>© 2026 Adsetspro Flow Inc. All rights reserved.</span>
            <span className="flex items-center gap-4">
              <Link href="/privacy" className={linkCls.replace('text-sm', 'text-xs')}>Privacy</Link>
              <Link href="/terms" className={linkCls.replace('text-sm', 'text-xs')}>Terms</Link>
            </span>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        /* ---------- Reveal ---------- */
        .lc-root .lc-reveal .lc-item {
          opacity: 0;
          transform: translateY(24px);
          filter: blur(6px);
          transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
            filter 0.9s ease;
          transition-delay: var(--d, 0ms);
        }
        .lc-root .lc-reveal .lc-item.lc-from-left { transform: translateX(-48px); }
        .lc-root .lc-reveal .lc-item.lc-from-right { transform: translateX(48px); }
        .lc-root .lc-reveal .lc-item.lc-zoom { transform: scale(0.94) translateY(24px); }
        .lc-root .lc-reveal[data-visible='true'] .lc-item {
          opacity: 1;
          transform: none;
          filter: none;
        }

        /* FAQ rows slide in from the right, one after another */
        .lc-root .lc-reveal .lc-faq-in {
          opacity: 0;
          transform: translateX(40px);
          transition: opacity 0.7s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), background 0.4s ease,
            box-shadow 0.4s ease;
          transition-delay: calc(300ms + var(--fi) * 110ms), calc(300ms + var(--fi) * 110ms), 0ms, 0ms;
        }
        .lc-root .lc-reveal[data-visible='true'] .lc-faq-in {
          opacity: 1;
          transform: none;
        }

        /* ---------- Pill ---------- */
        .lc-root .lc-pill {
          background: linear-gradient(var(--lc-bg, #0a0d1c), var(--lc-bg, #0a0d1c)) padding-box,
            linear-gradient(90deg, rgba(34, 211, 238, 0.55), rgba(139, 92, 246, 0.55), rgba(236, 72, 153, 0.55)) border-box;
          border: 1px solid transparent;
        }
        html:not(.dark) .lc-root .lc-pill { --lc-bg: #ffffff; }

        /* ---------- FAQ items ---------- */
        .lc-root .lc-faq {
          background: rgba(255, 255, 255, 0.02);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.07);
          transition: background 0.4s ease, box-shadow 0.4s ease;
        }
        .lc-root .lc-faq:hover {
          background: rgba(255, 255, 255, 0.035);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
        }
        .lc-root .lc-faq.is-open {
          background: linear-gradient(180deg, rgba(139, 92, 246, 0.09), rgba(255, 255, 255, 0.02) 70%);
          box-shadow: inset 0 0 0 1px rgba(168, 85, 247, 0.35), 0 20px 50px -25px rgba(168, 85, 247, 0.6);
        }
        .lc-root .lc-faq.is-open::before {
          content: '';
          position: absolute;
          left: 15%;
          right: 15%;
          top: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
        }
        html:not(.dark) .lc-root .lc-faq { background: #fff; box-shadow: inset 0 0 0 1px #e2e8f0; }
        html:not(.dark) .lc-root .lc-faq.is-open {
          background: linear-gradient(180deg, #f5f3ff, #fff 70%);
          box-shadow: inset 0 0 0 1px #c4b5fd, 0 20px 50px -25px rgba(139, 92, 246, 0.45);
        }

        /* ---------- CTA ---------- */
        .lc-root .lc-cta {
          background: radial-gradient(500px circle at var(--mx, 50%) var(--my, 0%), rgba(217, 70, 239, 0.8), transparent 45%),
            linear-gradient(180deg, rgba(244, 114, 182, 0.7), rgba(139, 92, 246, 0.35) 40%, rgba(34, 211, 238, 0.25));
          box-shadow: 0 40px 100px -40px rgba(168, 85, 247, 0.7);
        }
        .lc-root .lc-cta-grid {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: radial-gradient(ellipse 60% 70% at 50% 0%, black, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 60% 70% at 50% 0%, black, transparent 75%);
        }
        .lc-root .lc-cta-spot {
          background: radial-gradient(500px circle at var(--mx, 50%) var(--my, -30%), rgba(255, 255, 255, 0.05), transparent 50%);
        }
        .lc-root .lc-aurora {
          animation: lcAurora 12s ease-in-out infinite alternate;
        }
        @keyframes lcAurora {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(40px, -30px) scale(1.15); }
        }
        .lc-root .lc-shimmer {
          background-size: 200% auto;
          animation: lcShimmer 6s linear infinite;
        }
        @keyframes lcShimmer {
          to { background-position: 200% center; }
        }
        .lc-root .lc-btn-shine {
          background: linear-gradient(110deg, transparent 35%, rgba(168, 85, 247, 0.25) 50%, transparent 65%);
          transform: translateX(-100%);
          animation: lcShine 3.5s ease-in-out infinite;
        }
        @keyframes lcShine {
          0%, 55% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* ---------- Footer ---------- */
        .lc-root .lc-link::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          height: 1px;
          width: 100%;
          background: linear-gradient(90deg, #2dd4bf, #6366f1);
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .lc-root .lc-link:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }
        .lc-root .lc-wordmark-text {
          font-family: inherit;
        }

        @media (prefers-reduced-motion: reduce) {
          .lc-root .lc-reveal .lc-item { opacity: 1; transform: none; filter: none; transition: none; }
          .lc-root .lc-reveal .lc-faq-in { opacity: 1; transform: none; transition: none; }
          .lc-root .lc-aurora, .lc-root .lc-shimmer, .lc-root .lc-btn-shine { animation: none; }
        }
      `}</style>
    </div>
  );
}
