'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Cpu,
  Bot,
  FolderGit2,
  CheckCircle2,
  Zap,
  TrendingUp,
  Database,
  FileText,
  MessageSquare,
  ArrowRight,
  Network,
  ListChecks,
  Activity,
} from 'lucide-react';

// =============================================================================
// AI SUITE SECTION: card-free feature showcase
//  - Left: feature list; the active item shows an auto-advancing progress line
//  - Right: a borderless, glowing "stage" with a live demo of the active
//    feature floating on the background (no boxes)
//  - Auto-rotates every few seconds; pauses on hover; click to choose
//  - Scroll reveal, reduced-motion safe, stacks on mobile
// =============================================================================

type Accent = 'cyan' | 'violet' | 'pink';

const FEATURES: {
  key: string;
  accent: Accent;
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'knowledge',
    accent: 'cyan',
    eyebrow: 'Knowledge',
    title: 'Autonomous Knowledge Mesh',
    body: 'Instant answers synthesized directly from your code commits, project PRDs, database schemas, and team channel threads.',
    icon: Network,
  },
  {
    key: 'planning',
    accent: 'violet',
    eyebrow: 'Planning',
    title: 'Automated Work Breakdown',
    body: 'Deconstruct complex PRDs and customer requirements into detailed Kanban tickets with test criteria, assignees, and velocity points.',
    icon: ListChecks,
  },
  {
    key: 'telemetry',
    accent: 'pink',
    eyebrow: 'Telemetry',
    title: 'Autonomous Standup & Telemetry',
    body: 'Autonomous daily standup synthesis and milestone velocity telemetry to keep your entire team aligned without meetings.',
    icon: Activity,
  },
];

const ACCENT = {
  cyan: { rgb: '45,212,191', text: 'text-teal-300', bar: 'from-teal-300 to-sky-400' },
  violet: { rgb: '59,130,246', text: 'text-sky-300', bar: 'from-sky-300 to-blue-500' },
  pink: { rgb: '99,102,241', text: 'text-indigo-300', bar: 'from-indigo-300 to-violet-400' },
} as const;

const CYCLE_MS = 7000;

export default function ClickUpBrainSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycleKey, setCycleKey] = useState(0); // restarts the progress line

  const [knowledgeActive, setKnowledgeActive] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [tasksGenerated, setTasksGenerated] = useState(false);
  const [standupGenerated, setStandupGenerated] = useState(true);
  const timers = useRef<number[]>([]);

  // Scroll reveal
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset.visible = 'true';
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    const pending = timers.current;
    return () => {
      io.disconnect();
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // Auto-advance (skipped while hovered or for reduced motion)
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setTimeout(() => {
      setActive((a) => (a + 1) % FEATURES.length);
      setCycleKey((k) => k + 1);
    }, CYCLE_MS);
    return () => window.clearTimeout(t);
  }, [active, paused, cycleKey]);

  const select = (i: number) => {
    setActive(i);
    setCycleKey((k) => k + 1);
  };

  const handleSynthesizeSprint = () => {
    setIsSynthesizing(true);
    setTasksGenerated(false);
    timers.current.push(
      window.setTimeout(() => {
        setIsSynthesizing(false);
        setTasksGenerated(true);
        timers.current.push(window.setTimeout(() => setTasksGenerated(false), 6000));
      }, 900)
    );
  };

  const tickets = [
    { id: 'AF-214', title: 'Tenant-scoped auth middleware', pts: 5, tag: 'Backend', tagCls: 'text-teal-300 bg-teal-400/10 ring-teal-400/20' },
    { id: 'AF-215', title: 'Kanban drag & drop states', pts: 3, tag: 'Frontend', tagCls: 'text-sky-300 bg-sky-400/10 ring-sky-400/20' },
    { id: 'AF-216', title: 'E2E tests: sprint rollover', pts: 2, tag: 'QA', tagCls: 'text-indigo-300 bg-indigo-400/10 ring-indigo-400/20' },
  ];

  const sources = [
    { label: 'Git Commits', icon: FolderGit2, pos: 'left-[2%] top-[8%]', color: 'text-teal-300', path: 'M 70 50 C 150 70, 190 120, 250 150' },
    { label: 'Specs & PRDs', icon: FileText, pos: 'right-[2%] top-[8%]', color: 'text-sky-300', path: 'M 430 50 C 350 70, 310 120, 250 150' },
    { label: 'Tenant DB', icon: Database, pos: 'left-[2%] bottom-[8%]', color: 'text-emerald-300', path: 'M 70 250 C 150 230, 190 180, 250 150' },
    { label: 'Channels', icon: MessageSquare, pos: 'right-[2%] bottom-[8%]', color: 'text-indigo-300', path: 'M 430 250 C 350 230, 310 180, 250 150' },
  ];

  const current = FEATURES[active];

  return (
    <section
      ref={sectionRef}
      className="ai-suite relative z-10 mx-auto my-12 max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
    >
      {/* ===== Background ===== */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 select-none overflow-visible">
        <div className="ai-grid absolute inset-0" />
        <div
          className="absolute right-[5%] top-[55%] h-[560px] w-[min(760px,90vw)] -translate-y-1/2 rounded-full blur-3xl transition-[background] duration-1000"
          style={{ background: `radial-gradient(closest-side, rgba(${ACCENT[current.accent].rgb},0.22), rgba(59,130,246,0.08), transparent)` }}
        />
      </div>

      {/* ===== Header ===== */}
      <div className="ai-reveal mx-auto mb-16 max-w-4xl space-y-5 text-center lg:mb-20" style={{ '--delay': '0ms' } as React.CSSProperties}>
        <div className="ai-pill relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold">
          <Cpu className="h-3.5 w-3.5 text-teal-300" />
          <span className="bg-gradient-to-r from-teal-200 via-sky-200 to-indigo-200 bg-clip-text font-semibold tracking-wide text-transparent">
            Adsetspro Neural Flow OS
          </span>
        </div>

        <h2 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Execute at{' '}
          <span className="ai-shimmer-text bg-gradient-to-r from-teal-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            10x Velocity
          </span>
          <br className="hidden sm:block" /> with Autonomous AI Intelligence
        </h2>

        <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          Instant cross-project knowledge recall, automated sprint ticket synthesis, and real-time executive telemetry built for modern startups.
        </p>
      </div>

      {/* ===== Showcase ===== */}
      <div
        className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ---- Feature list ---- */}
        <div className="ai-reveal relative" style={{ '--delay': '120ms' } as React.CSSProperties}>
          {/* Rail */}
          <div aria-hidden className="absolute bottom-6 left-[35px] top-6 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          <ol className="relative space-y-2">
            {FEATURES.map((f, i) => {
              const isActive = i === active;
              const a = ACCENT[f.accent];
              const Icon = f.icon;
              return (
                <li key={f.key}>
                  <button
                    type="button"
                    onClick={() => select(i)}
                    aria-pressed={isActive}
                    className={`group relative flex w-full cursor-pointer gap-5 rounded-2xl px-4 py-4 text-left transition-all duration-500 ${isActive ? 'ai-item-active' : 'hover:bg-white/[0.025]'}`}
                    style={{ '--item-rgb': a.rgb } as React.CSSProperties}
                  >
                    {/* Node on the rail */}
                    <span
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                        isActive ? 'bg-[#0b0f22]' : 'bg-[#080b18]'
                      }`}
                      style={{
                        boxShadow: isActive
                          ? `0 0 0 1px rgba(${a.rgb},0.6), 0 0 24px -2px rgba(${a.rgb},0.7)`
                          : '0 0 0 1px rgba(255,255,255,0.1)',
                      }}
                    >
                      <Icon className={`h-4.5 w-4.5 transition-colors duration-500 ${isActive ? a.text : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className={`flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-500 ${isActive ? a.text : 'text-zinc-600'}`}>
                        {f.eyebrow}
                        <span className="font-mono text-[10px] tracking-normal text-zinc-600">0{i + 1}</span>
                      </span>
                      <span
                        className={`mt-1 block text-lg font-semibold tracking-tight transition-colors duration-500 sm:text-xl ${
                          isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}
                      >
                        {f.title}
                      </span>
                      <span
                        className={`grid transition-all duration-500 ease-out ${
                          isActive ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <span className="overflow-hidden text-sm leading-relaxed text-white/60">{f.body}</span>
                      </span>

                      {/* Progress line */}
                      <span className="mt-4 block h-px w-full overflow-hidden bg-white/[0.06]">
                        {isActive && (
                          <span
                            key={cycleKey}
                            className={`ai-progress block h-full bg-gradient-to-r ${a.bar}`}
                            style={{
                              animationDuration: `${CYCLE_MS}ms`,
                              animationPlayState: paused ? 'paused' : 'running',
                            }}
                          />
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* ---- Stage (borderless, floating) ---- */}
        <div
          className="ai-reveal relative mx-auto h-[340px] w-full max-w-[560px] sm:h-[380px]"
          style={{ '--delay': '240ms' } as React.CSSProperties}
        >
          {/* Soft floor glow + orbit ring */}
          <div
            aria-hidden
            className="absolute inset-x-[10%] bottom-0 h-24 rounded-[100%] blur-2xl transition-[background] duration-1000"
            style={{ background: `radial-gradient(closest-side, rgba(${ACCENT[current.accent].rgb},0.35), transparent)` }}
          />
          <div aria-hidden className="ai-floor absolute inset-x-[-15%] bottom-[-18%] h-[55%]" />
          <div aria-hidden className="ai-orbit absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05]">
            <span className="ai-orbit-dot absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300" />
            <span className="ai-orbit-dot absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-300" />
          </div>
          <div aria-hidden className="ai-orbit-rev absolute left-1/2 top-1/2 h-[96%] w-[96%] -translate-x-1/2 -translate-y-1/2 rounded-full">
            <span className="ai-orbit-dot absolute left-0 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300" />
          </div>
          <div aria-hidden className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />

          {/* Scene 1: Knowledge Mesh */}
          <div className={`ai-scene ${active === 0 ? 'is-active' : ''}`} aria-hidden={active !== 0}>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 300" preserveAspectRatio="none" fill="none">
              <defs>
                <linearGradient id="ai-link" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              {sources.map((s, i) => (
                <g key={s.label}>
                  <path d={s.path} stroke="url(#ai-link)" strokeWidth="1" />
                  <path d={s.path} stroke="#fff" strokeWidth="1.8" strokeLinecap="round" className="ai-flow" style={{ animationDelay: `${i * 0.55}s` }} />
                </g>
              ))}
            </svg>

            {sources.map(({ label, icon: Icon, pos, color }, i) => (
              <div
                key={label}
                className={`ai-float ai-source absolute ${pos} flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-zinc-100 backdrop-blur-md`}
                style={{ animationDelay: `${i * -1.3}s` }}
              >
                <Icon className={`h-4 w-4 ${color}`} />
                {label}
              </div>
            ))}

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="ai-halo absolute left-1/2 top-1/2 h-32 w-32 rounded-full" />
              <span className="ai-ring absolute left-1/2 top-1/2 h-40 w-40 rounded-full border border-teal-300/25" />
              <span className="ai-ring absolute left-1/2 top-1/2 h-40 w-40 rounded-full border border-indigo-300/25" style={{ animationDelay: '1.5s' }} />
              <button
                type="button"
                tabIndex={active === 0 ? 0 : -1}
                onClick={() => setKnowledgeActive((v) => !v)}
                className="relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full bg-[conic-gradient(from_180deg,#2dd4bf,#3b82f6,#6366f1,#2dd4bf)] p-[2px] shadow-[0_0_60px_rgba(59,130,246,0.65)] transition-transform duration-300 hover:scale-105 active:scale-95"
                title="Click to query live knowledge base"
              >
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0b1024]">
                  <Bot className="h-10 w-10 text-white drop-shadow-[0_0_12px_rgba(125,211,252,0.9)]" />
                </span>
              </button>
            </div>

            {knowledgeActive && (
              <div className="animate-in fade-in slide-in-from-bottom-2 absolute inset-x-[12%] bottom-[26%] z-20 flex items-center justify-between rounded-full bg-[#0b1024]/90 px-4 py-2 text-xs text-teal-50 ring-1 ring-teal-400/30 backdrop-blur">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-teal-300" />
                  Synthesized answers across 24 commits &amp; 3 specs
                </span>
                <button type="button" onClick={() => setKnowledgeActive(false)} className="ml-2 cursor-pointer text-zinc-400 hover:text-white" aria-label="Close">
                  &times;
                </button>
              </div>
            )}
          </div>

          {/* Scene 2: Work Breakdown */}
          <div className={`ai-scene flex flex-col justify-center px-2 sm:px-6 ${active === 1 ? 'is-active' : ''}`} aria-hidden={active !== 1}>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3.5 py-2 text-xs font-medium text-zinc-100 ring-1 ring-white/10">
                <FileText className="h-4 w-4 text-sky-300" />
                Feature Brief
              </span>
              <span className="relative h-px flex-1 overflow-hidden bg-white/10">
                <span className="ai-dash absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3.5 py-2 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/25">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                3 Sprints
              </span>
            </div>

            <div className="space-y-2.5">
              {tickets.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 rounded-full px-4 py-3 ring-1 backdrop-blur-sm transition-all duration-500 ${
                    tasksGenerated ? 'bg-white/[0.05] opacity-100 ring-white/10' : 'bg-white/[0.02] opacity-60 ring-white/[0.05]'
                  }`}
                  style={{ transitionDelay: tasksGenerated ? `${i * 120}ms` : '0ms', marginLeft: `${i * 6}%`, marginRight: `${(2 - i) * 6}%` }}
                >
                  {tasksGenerated ? (
                    <>
                      <span className="font-mono text-[10px] text-zinc-500">{t.id}</span>
                      <span className="flex-1 truncate text-[13px] text-zinc-100">{t.title}</span>
                      <span className={`hidden rounded-full px-2 py-0.5 text-[10px] ring-1 sm:inline ${t.tagCls}`}>{t.tag}</span>
                      <span className="font-mono text-[10px] text-zinc-400">{t.pts}pt</span>
                    </>
                  ) : (
                    <>
                      <span className="ai-skeleton h-2 w-10 rounded-full" />
                      <span className="ai-skeleton h-2 flex-1 rounded-full" style={{ animationDelay: `${i * 0.2}s` }} />
                      <span className="ai-skeleton h-2 w-8 rounded-full" />
                    </>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              tabIndex={active === 1 ? 0 : -1}
              onClick={handleSynthesizeSprint}
              disabled={isSynthesizing}
              className="group/btn relative mx-auto mt-6 flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-6px_rgba(59,130,246,0.8)] transition-all hover:shadow-[0_10px_40px_-6px_rgba(45,212,191,0.8)] active:scale-[0.98] disabled:cursor-wait"
            >
              <span className="ai-btn-shine pointer-events-none absolute inset-0" />
              <Sparkles className={`h-4 w-4 ${isSynthesizing ? 'animate-spin' : 'transition-transform group-hover/btn:rotate-12'}`} />
              <span>{isSynthesizing ? 'Synthesizing sprint…' : tasksGenerated ? 'Tickets ready' : 'Synthesize Sprint Tickets'}</span>
              {!isSynthesizing && <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />}
            </button>
          </div>

          {/* Scene 3: Standup & Telemetry */}
          <div className={`ai-scene flex flex-col justify-center px-2 sm:px-6 ${active === 2 ? 'is-active' : ''}`} aria-hidden={active !== 2}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full bg-sky-400/10 px-3.5 py-1.5 text-xs font-medium text-sky-200 ring-1 ring-sky-400/25">
                <TrendingUp className="h-4 w-4 text-sky-300" />
                Velocity +28% WoW
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3.5 py-1.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/25">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                0 Blockers
              </span>
            </div>

            <div className="mt-6 flex h-24 items-end gap-2">
              {[38, 52, 45, 60, 58, 72, 68, 85, 80, 96].map((v, i) => (
                <span
                  key={i}
                  className="ai-bar flex-1 rounded-full bg-gradient-to-t from-indigo-500/20 via-sky-400/60 to-teal-300"
                  style={{ height: `${v}%`, animationDelay: `${i * 70}ms` }}
                />
              ))}
            </div>

            <div className={`mt-6 space-y-2 text-[13px] text-zinc-300 transition-opacity duration-500 ${standupGenerated ? 'opacity-100' : 'opacity-40'}`}>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-indigo-300" />
                Daily Standup Digest
                <span className="ml-auto font-mono text-[10px] font-normal text-zinc-500">09:00 auto-run</span>
              </div>
              <p className="flex gap-2 leading-snug">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span><strong className="font-semibold text-white">Yesterday:</strong> 14 PRs merged across Auth, Multi-tenant DB &amp; Dark Theme.</span>
              </p>
              <p className="flex gap-2 leading-snug">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="font-semibold text-white">Today:</strong> P95 latency stress tests &amp; staging sign-off.</span>
              </p>
            </div>

            <button
              type="button"
              tabIndex={active === 2 ? 0 : -1}
              onClick={() => setStandupGenerated((v) => !v)}
              className="mx-auto mt-6 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white/[0.05] px-6 py-2.5 text-xs font-semibold text-white ring-1 ring-white/10 transition-all hover:bg-indigo-400/10 hover:shadow-[0_0_30px_-6px_rgba(99,102,241,0.7)] hover:ring-indigo-400/50 active:scale-[0.98]"
            >
              <Zap className="h-3.5 w-3.5 text-indigo-300" />
              {standupGenerated ? 'Re-Sync Standup Digest' : 'Generate Instant CatchUp'}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* ---------- Reveal ---------- */
        .ai-suite .ai-reveal {
          opacity: 0;
          transform: translateY(28px);
          filter: blur(6px);
          transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
            filter 0.9s ease;
          transition-delay: var(--delay, 0ms);
        }
        .ai-suite[data-visible='true'] .ai-reveal {
          opacity: 1;
          transform: none;
          filter: none;
        }

        /* ---------- Active feature: glass card ---------- */
        .ai-suite .ai-item-active {
          background: linear-gradient(135deg, rgba(var(--item-rgb), 0.1), rgba(255, 255, 255, 0.02) 60%) padding-box,
            linear-gradient(135deg, rgba(var(--item-rgb), 0.55), rgba(255, 255, 255, 0.06) 50%, rgba(var(--item-rgb), 0.25)) border-box;
          border: 1px solid transparent;
          box-shadow: 0 20px 50px -25px rgba(var(--item-rgb), 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .ai-suite li > button { border: 1px solid transparent; }

        /* ---------- Stage: 3D floor grid ---------- */
        .ai-suite .ai-floor {
          background-image: linear-gradient(to right, rgba(96, 165, 250, 0.22) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(96, 165, 250, 0.22) 1px, transparent 1px);
          background-size: 40px 40px;
          transform: perspective(500px) rotateX(62deg);
          transform-origin: center top;
          mask-image: radial-gradient(ellipse 60% 80% at 50% 0%, black 20%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse 60% 80% at 50% 0%, black 20%, transparent 70%);
          animation: aiFloor 6s linear infinite;
        }
        @keyframes aiFloor {
          from { background-position: 0 0; }
          to { background-position: 0 40px; }
        }
        .ai-suite .ai-orbit-dot {
          box-shadow: 0 0 12px 2px currentColor, 0 0 4px #fff;
          color: rgba(125, 211, 252, 0.9);
        }
        .ai-suite .ai-orbit-rev {
          animation: aiSpinRev 40s linear infinite;
        }
        @keyframes aiSpinRev {
          to { transform: rotate(-360deg); }
        }
        .ai-suite .ai-halo {
          translate: -50% -50%;
          background: conic-gradient(from 0deg, transparent, rgba(45, 212, 191, 0.8), transparent 30%, rgba(99, 102, 241, 0.8), transparent 70%);
          filter: blur(14px);
          animation: aiSpinHalo 6s linear infinite;
        }
        @keyframes aiSpinHalo {
          to { transform: rotate(360deg); }
        }
        .ai-suite .ai-source {
          background: linear-gradient(rgba(10, 15, 34, 0.85), rgba(10, 15, 34, 0.85)) padding-box,
            linear-gradient(135deg, rgba(45, 212, 191, 0.45), rgba(255, 255, 255, 0.08), rgba(99, 102, 241, 0.45)) border-box;
          border: 1px solid transparent;
          box-shadow: 0 10px 30px -12px rgba(59, 130, 246, 0.6);
        }

        /* ---------- Background grid ---------- */
        .ai-suite .ai-grid {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 75%);
        }

        /* ---------- Pill ---------- */
        .ai-suite .ai-pill {
          background: linear-gradient(#0a0d1c, #0a0d1c) padding-box,
            linear-gradient(90deg, rgba(45, 212, 191, 0.7), rgba(96, 165, 250, 0.7), rgba(99, 102, 241, 0.7)) border-box;
          border: 1px solid transparent;
          box-shadow: 0 0 24px -6px rgba(59, 130, 246, 0.7);
        }

        /* ---------- Headline shimmer ---------- */
        .ai-suite .ai-shimmer-text {
          background-size: 200% auto;
          animation: aiShimmer 6s linear infinite;
        }
        @keyframes aiShimmer {
          to { background-position: 200% center; }
        }

        /* ---------- Progress line ---------- */
        .ai-suite .ai-progress {
          transform-origin: left;
          animation-name: aiProgress;
          animation-timing-function: linear;
          animation-fill-mode: both;
        }
        @keyframes aiProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        /* ---------- Stage scenes (crossfade + depth) ---------- */
        .ai-suite .ai-scene {
          position: absolute;
          inset: 0;
          opacity: 0;
          transform: scale(0.94) translateY(12px);
          filter: blur(8px);
          pointer-events: none;
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1),
            filter 0.7s ease;
        }
        .ai-suite .ai-scene.is-active {
          opacity: 1;
          transform: none;
          filter: none;
          pointer-events: auto;
          transition-delay: 0.15s;
        }
        .ai-suite .ai-orbit {
          border-style: dashed;
          animation: aiSpin 60s linear infinite;
        }
        @keyframes aiSpin {
          to { transform: rotate(360deg); } /* centering uses the separate 'translate' property */
        }
        .ai-suite .ai-float {
          animation: aiFloat 6s ease-in-out infinite;
        }
        @keyframes aiFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        /* ---------- Scene 1 ---------- */
        .ai-suite .ai-flow {
          stroke-dasharray: 16 600;
          stroke-dashoffset: 16;
          filter: drop-shadow(0 0 4px rgba(167, 139, 250, 0.9));
          animation: aiFlow 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
        @keyframes aiFlow {
          from { stroke-dashoffset: 16; opacity: 1; }
          90% { opacity: 1; }
          to { stroke-dashoffset: -230; opacity: 0; }
        }
        .ai-suite .ai-ring {
          animation: aiRing 3s ease-out infinite;
        }
        @keyframes aiRing {
          from { transform: translate(-50%, -50%) scale(0.55); opacity: 0.9; }
          to { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }

        /* ---------- Scene 2 ---------- */
        .ai-suite .ai-dash {
          animation: aiDash 1.8s linear infinite;
        }
        @keyframes aiDash {
          from { left: -35%; }
          to { left: 100%; }
        }
        .ai-suite .ai-skeleton {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.05));
          background-size: 200% 100%;
          animation: aiSkeleton 1.6s ease-in-out infinite;
        }
        @keyframes aiSkeleton {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
        .ai-suite .ai-btn-shine {
          background: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.35) 50%, transparent 65%);
          transform: translateX(-100%);
          animation: aiBtnShine 3.5s ease-in-out infinite;
        }
        @keyframes aiBtnShine {
          0%, 60% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* ---------- Scene 3: bars regrow each time the scene opens ---------- */
        .ai-suite .ai-bar {
          transform-origin: bottom;
          transform: scaleY(0);
        }
        .ai-suite .ai-scene.is-active .ai-bar {
          animation: aiBar 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes aiBar {
          to { transform: scaleY(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .ai-suite .ai-reveal, .ai-suite .ai-scene { transition: none; filter: none; }
          .ai-suite .ai-reveal { opacity: 1; transform: none; }
          .ai-suite .ai-bar { transform: none; }
          .ai-suite .ai-flow, .ai-suite .ai-ring, .ai-suite .ai-dash, .ai-suite .ai-skeleton,
          .ai-suite .ai-btn-shine, .ai-suite .ai-shimmer-text, .ai-suite .ai-orbit, .ai-suite .ai-float,
          .ai-suite .ai-floor, .ai-suite .ai-orbit-rev, .ai-suite .ai-halo,
          .ai-suite .ai-bar {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
