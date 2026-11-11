'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import SectionAmbience from './SectionAmbience';
import { ArrowRight, Clock, Sparkles, LayoutGrid, UserCheck, AlarmClock } from 'lucide-react';

// =============================================================================
// PLAN SMARTER: centered showcase (different rhythm from the 2-column sections)
//  - Centered heading block
//  - Large framed product screenshot with a cursor spotlight, a slow scan
//    light, and floating badges that sit half outside the frame
//  - Three steps as a horizontal timeline (stacks on mobile)
// =============================================================================

const STEPS = [
  { icon: LayoutGrid, text: 'Drag-and-drop Kanban and sticky column table views' },
  { icon: UserCheck, text: 'One-click employee task assignments with smart skill matching' },
  { icon: AlarmClock, text: 'Instant visual urgency cues for tasks due within 1 hour' },
];

export default function PlanSmarterShowcase() {
  const rootRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);

  // Scroll-driven 3D: the screenshot starts tilted back and lands flat
  useEffect(() => {
    const el = tiltRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let cur = 0;
    const loop = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const target = Math.min(1, Math.max(0, (vh * 0.95 - r.top) / (vh * 0.6)));
      cur += (target - cur) * 0.12;
      const p = 1 - Math.pow(1 - cur, 3);
      el.style.transform = `perspective(1400px) rotateX(${((1 - p) * 20).toFixed(2)}deg) scale(${(0.9 + p * 0.1).toFixed(4)})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.dataset.visible = 'true';
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <section id="planning" ref={rootRef} className="ps-root relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <SectionAmbience focus="center" />

      {/* Heading */}
      <div className="ps-in mx-auto max-w-3xl space-y-5 text-center" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div className="hp-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-200">
          <Sparkles className="h-3.5 w-3.5 text-sky-300" />
          <span>Intelligent Execution</span>
        </div>
        <h2 className="text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
          Plan Smarter.{' '}
          <span className="hp-shimmer bg-gradient-to-r from-teal-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Get Work Done Faster.
          </span>
        </h2>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          Organize tasks, assign responsibilities, and set deadlines in seconds. Adsetspro Flow keeps your projects
          structured and your team aligned, helping you move from planning to completion with ease.
        </p>
      </div>

      {/* Screenshot stage */}
      <div className="ps-in relative mx-auto mt-14 max-w-5xl sm:mt-16" style={{ '--d': '150ms' } as React.CSSProperties}>
        {/* Back glow */}
        <div aria-hidden className="pointer-events-none absolute -inset-x-10 -bottom-10 top-10 rounded-[48px] bg-[radial-gradient(50%_60%_at_50%_60%,rgba(59,130,246,0.35),rgba(45,212,191,0.12)_50%,transparent_75%)] blur-2xl" />

        <div ref={tiltRef} className="will-change-transform" style={{ transformOrigin: '50% 0%' }}>
        <div ref={frameRef} onMouseMove={onMove} className="ps-frame group relative rounded-[22px] p-px sm:rounded-[30px]">
          <div className="relative overflow-hidden rounded-[21px] bg-[#070a16] sm:rounded-[29px]">
            {/* Window bar */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              <span className="ml-3 hidden truncate rounded-md bg-white/[0.04] px-3 py-0.5 font-mono text-[10px] text-zinc-500 ring-1 ring-white/[0.06] sm:block">
                Sprint 6 · Gantt &amp; Table
              </span>
            </div>

            <div className="relative aspect-video w-full overflow-hidden">
              <img
                src="/images/smart_task_planning.jpg"
                alt="Plan Smarter. Get Work Done Faster - Smart Task Planning"
                className="h-full w-full object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.025]"
              />
              {/* Scan light + cursor spotlight */}
              <div aria-hidden className="ps-scan pointer-events-none absolute inset-y-0 w-1/3" />
              <div aria-hidden className="ps-spot pointer-events-none absolute inset-0" />
            </div>
          </div>
        </div>

        </div>

        {/* Floating badges (half outside the frame on larger screens) */}
        <div className="animate-float absolute -top-4 left-4 flex items-center gap-2 rounded-full bg-[#0a0f22]/90 px-3 py-1.5 text-[11px] font-semibold text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-md sm:-left-6 sm:-top-5 sm:px-4 sm:py-2 sm:text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
          </span>
          <Clock className="h-3.5 w-3.5 text-sky-300" />
          <span>Gantt Milestones &amp; Live Deadlines</span>
        </div>
        <div className="animate-float-delayed absolute -bottom-4 right-4 flex items-center gap-2 rounded-full bg-[#0a0f22]/90 px-3 py-1.5 font-mono text-[11px] font-semibold text-sky-200 shadow-2xl ring-1 ring-sky-400/30 backdrop-blur-md sm:-bottom-5 sm:-right-6 sm:px-4 sm:py-2 sm:text-xs">
          <Sparkles className="h-3.5 w-3.5 animate-spin text-teal-300" style={{ animationDuration: '5s' }} />
          <span>AI Schedulers: Active</span>
        </div>
      </div>

      {/* Steps timeline */}
      <div className="ps-in relative mx-auto mt-20 max-w-5xl" style={{ '--d': '300ms' } as React.CSSProperties}>
        {/* Connecting line (desktop) */}
        <div aria-hidden className="absolute left-[16.66%] right-[16.66%] top-6 hidden h-px bg-gradient-to-r from-teal-400/60 via-sky-400/60 to-indigo-400/60 md:block">
          <span className="ps-pulse absolute top-1/2 h-1.5 w-16 -translate-y-1/2 rounded-full" />
        </div>

        <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map(({ icon: Icon, text }, i) => (
            <li
              key={text}
              className="ps-step relative flex items-start gap-4 text-left md:flex-col md:items-center md:text-center"
              style={{ '--i': i } as React.CSSProperties}
            >
              <span className="hp-num relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white">
                <Icon className="h-5 w-5" />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0a0f22] font-mono text-[10px] font-semibold text-sky-200 ring-1 ring-sky-400/40">
                  {i + 1}
                </span>
              </span>
              <span className="pt-1 text-[15px] font-medium leading-snug text-zinc-200 md:max-w-[15rem] md:pt-0">{text}</span>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center">
          <Link
            href="/register"
            className="hp-btn-primary btn-shine inline-flex cursor-pointer items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
          >
            <span>Sign Up Now</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .ps-root .ps-in {
          opacity: 0;
          transform: translateY(26px);
          filter: blur(6px);
          transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
            filter 0.9s ease;
          transition-delay: var(--d, 0ms);
        }
        .ps-root[data-visible='true'] .ps-in {
          opacity: 1;
          transform: none;
          filter: none;
        }
        .ps-root .ps-frame {
          background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 0%), rgba(94, 234, 212, 0.9), transparent 45%),
            linear-gradient(160deg, rgba(45, 212, 191, 0.7), rgba(59, 130, 246, 0.3) 45%, rgba(99, 102, 241, 0.7));
          box-shadow: 0 40px 100px -35px rgba(59, 130, 246, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.03);
        }
        .ps-root .ps-spot {
          background: radial-gradient(500px circle at var(--mx, 50%) var(--my, -30%), rgba(255, 255, 255, 0.07), transparent 50%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .ps-root .ps-frame:hover .ps-spot {
          opacity: 1;
        }
        .ps-root .ps-scan {
          background: linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.1), rgba(255, 255, 255, 0.12), rgba(125, 211, 252, 0.1), transparent);
          transform: translateX(-120%) skewX(-12deg);
          animation: psScan 7s ease-in-out infinite;
        }
        @keyframes psScan {
          0%, 55% { transform: translateX(-120%) skewX(-12deg); }
          100% { transform: translateX(380%) skewX(-12deg); }
        }
        .ps-root .ps-pulse {
          background: linear-gradient(90deg, transparent, #ffffff, transparent);
          box-shadow: 0 0 12px 2px rgba(125, 211, 252, 0.8);
          animation: psPulse 3.2s ease-in-out infinite;
        }
        @keyframes psPulse {
          from { left: -5%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          to { left: 95%; opacity: 0; }
        }
        /* Steps enter from the left, bottom and right */
        .ps-root .ps-step {
          opacity: 0;
          transition: opacity 0.8s ease, transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
          transition-delay: calc(450ms + var(--i) * 160ms);
        }
        .ps-root .ps-step:nth-child(1) { transform: translateX(-48px); }
        .ps-root .ps-step:nth-child(2) { transform: translateY(36px); }
        .ps-root .ps-step:nth-child(3) { transform: translateX(48px); }
        .ps-root[data-visible='true'] .ps-step { opacity: 1; transform: none; }

        @media (prefers-reduced-motion: reduce) {
          .ps-root .ps-step { opacity: 1; transform: none; transition: none; }
          .ps-root .ps-in { opacity: 1; transform: none; filter: none; transition: none; }
          .ps-root .ps-scan, .ps-root .ps-pulse { animation: none; display: none; }
        }
      `}</style>
    </section>
  );
}
