'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  Layers,
  Bot,
  FolderGit2,
  CheckCircle2,
  Check,
  Zap,
  TrendingUp,
  Flame,
  ArrowRight,
  Search,
  Database,
  FileText,
  MessageSquare,
  GitBranch,
} from 'lucide-react';

export default function ClickUpBrainSection() {
  // Card 1: Autonomous Knowledge Mesh interactive state
  const [knowledgeActive, setKnowledgeActive] = useState(false);

  // Card 2: Automated Sprint Breakdown interactive state
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [tasksGenerated, setTasksGenerated] = useState(false);

  // Card 3: Executive Standup CatchUp interactive state
  const [standupGenerated, setStandupGenerated] = useState(true);

  const handleSynthesizeSprint = () => {
    setIsSynthesizing(true);
    setTasksGenerated(false);
    setTimeout(() => {
      setIsSynthesizing(false);
      setTasksGenerated(true);
      setTimeout(() => setTasksGenerated(false), 5000);
    }, 800);
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 overflow-visible my-12">
      {/* =====================================================================
          1. HIGH-TECH PCB MOTHERBOARD CIRCUIT TRACES & AMBIENT ENERGY FIELD
         ===================================================================== */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-visible select-none -z-10"
      >
        {/* Deep Ambient Cosmic Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[950px] h-[520px] bg-gradient-to-r from-indigo-900/15 via-cyan-900/12 to-purple-900/15 rounded-full blur-[150px]" />
        <div className="absolute top-16 left-1/4 w-[380px] h-[380px] bg-cyan-600/10 rounded-full blur-[110px]" />
        <div className="absolute top-16 right-1/4 w-[380px] h-[380px] bg-indigo-600/10 rounded-full blur-[110px]" />

        {/* Authentic High-Precision PCB Circuit Architecture */}
        <svg
          className="w-full h-full opacity-70 dark:opacity-85"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 680"
        >
          <defs>
            <linearGradient id="neural-trace-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="neural-trace-purple" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.25" />
            </linearGradient>

            <linearGradient id="neural-fade-right" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="neural-fade-left" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>

            <filter id="neural-via-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle Tech PCB Background Grid */}
            <pattern id="neural-pcb-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(56, 189, 248, 0.04)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#neural-pcb-grid)" opacity="0.85" />

          {/* ===== TOP TITLE FRAMING TRACES ===== */}
          <path
            d="M 220,110 L 320,110 L 360,65 L 500,65"
            fill="none"
            stroke="url(#neural-trace-cyan)"
            strokeWidth="1.8"
          />
          <circle cx="220" cy="110" r="4" fill="#38bdf8" filter="url(#neural-via-glow)" />
          <circle cx="220" cy="110" r="1.8" fill="#ffffff" />

          <path
            d="M 980,110 L 880,110 L 840,65 L 700,65"
            fill="none"
            stroke="url(#neural-trace-cyan)"
            strokeWidth="1.8"
          />
          <circle cx="980" cy="110" r="4" fill="#a855f7" filter="url(#neural-via-glow)" />
          <circle cx="980" cy="110" r="1.8" fill="#ffffff" />

          {/* ===== LEFT FLANK CIRCUIT ARCHITECTURE ===== */}
          <path
            d="M 55,340 L 55,190"
            fill="none"
            stroke="#6366f1"
            strokeWidth="1.75"
            strokeOpacity="0.75"
          />
          <path
            d="M 55,230 L 100,185 L 165,185"
            fill="none"
            stroke="url(#neural-fade-right)"
            strokeWidth="1.75"
          />
          <path
            d="M 35,305 L 80,260 L 160,260"
            fill="none"
            stroke="url(#neural-trace-cyan)"
            strokeWidth="1.8"
          />
          <circle cx="160" cy="260" r="4.5" fill="#38bdf8" filter="url(#neural-via-glow)" />
          <circle cx="160" cy="260" r="2" fill="#ffffff" opacity="0.9" />

          {/* Dashed 45° Riser */}
          <path
            d="M 20,380 L 95,380"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeDasharray="7 5"
            strokeOpacity="0.8"
          />
          <circle cx="95" cy="380" r="4" fill="#06b6d4" filter="url(#neural-via-glow)" />
          <circle cx="95" cy="380" r="1.8" fill="#ffffff" />
          <path
            d="M 95,380 L 135,340 L 210,340"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeDasharray="7 5"
            strokeOpacity="0.85"
          />

          {/* Outer Left Motherboard Contour Bus */}
          <path
            d="M 25,140 L 45,140 L 70,165 L 70,490 L 45,515 L 20,515"
            fill="none"
            stroke="url(#neural-trace-purple)"
            strokeWidth="1.5"
          />
          <circle cx="25" cy="140" r="3" fill="#6366f1" />
          <circle cx="20" cy="515" r="3" fill="#6366f1" />

          {/* ===== RIGHT FLANK CIRCUIT ARCHITECTURE (SYMMETRIC) ===== */}
          <path
            d="M 1145,340 L 1145,190"
            fill="none"
            stroke="#6366f1"
            strokeWidth="1.75"
            strokeOpacity="0.75"
          />
          <path
            d="M 1145,230 L 1100,185 L 1035,185"
            fill="none"
            stroke="url(#neural-fade-left)"
            strokeWidth="1.75"
          />
          <path
            d="M 1165,305 L 1120,260 L 1040,260"
            fill="none"
            stroke="url(#neural-trace-cyan)"
            strokeWidth="1.8"
          />
          <circle cx="1040" cy="260" r="4.5" fill="#38bdf8" filter="url(#neural-via-glow)" />
          <circle cx="1040" cy="260" r="2" fill="#ffffff" opacity="0.9" />

          {/* Dashed 45° Riser (Right) */}
          <path
            d="M 1180,380 L 1105,380"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeDasharray="7 5"
            strokeOpacity="0.8"
          />
          <circle cx="1105" cy="380" r="4" fill="#06b6d4" filter="url(#neural-via-glow)" />
          <circle cx="1105" cy="380" r="1.8" fill="#ffffff" />
          <path
            d="M 1105,380 L 1065,340 L 990,340"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeDasharray="7 5"
            strokeOpacity="0.85"
          />

          {/* Outer Right Motherboard Contour Bus */}
          <path
            d="M 1175,140 L 1155,140 L 1130,165 L 1130,490 L 1155,515 L 1180,515"
            fill="none"
            stroke="url(#neural-trace-purple)"
            strokeWidth="1.5"
          />
          <circle cx="1175" cy="140" r="3" fill="#a855f7" />
          <circle cx="1180" cy="515" r="3" fill="#a855f7" />

          {/* ===== BOTTOM INTER-CARD BUS TRACES ===== */}
          <path
            d="M 300,625 L 440,625 L 470,650 L 730,650 L 760,625 L 900,625"
            fill="none"
            stroke="url(#neural-trace-cyan)"
            strokeWidth="1.6"
            strokeDasharray="7 5"
          />
          <circle cx="470" cy="650" r="3.5" fill="#38bdf8" filter="url(#neural-via-glow)" />
          <circle cx="730" cy="650" r="3.5" fill="#a855f7" filter="url(#neural-via-glow)" />
          <circle cx="300" cy="625" r="3" fill="#38bdf8" />
          <circle cx="900" cy="625" r="3" fill="#a855f7" />
        </svg>
      </div>

      {/* =====================================================================
          2. SECTION HEADER (BESPOKE ADSETSPRO NEURAL SUITE BRANDING)
         ===================================================================== */}
      <div className="text-center space-y-4 max-w-4xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-300 to-purple-300 font-bold tracking-wide">
            Adsetspro Neural Flow OS
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
          Execute at 10x Velocity with Autonomous AI Intelligence
        </h2>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Instant cross-project knowledge recall, automated sprint ticket synthesis, and real-time executive telemetry built for modern startups.
        </p>
      </div>

      {/* =====================================================================
          3. THREE FLAGSHIP AI SUITE COMMAND CARDS (PREMIUM BESPOKE UI/UX)
         ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {/* -------------------------------------------------------------------
            CARD 1: Autonomous Knowledge Mesh (Interactive Neural Synapses)
           ------------------------------------------------------------------- */}
        <div className="p-7 rounded-3xl bg-[#080d1a]/95 border border-white/[0.08] shadow-2xl hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
          {/* Subtle Ambient Corner Glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />

          {/* Top Visual Area (Synapse Wiring to Real Connected Apps) */}
          <div className="relative h-64 w-full flex items-center justify-center select-none">
            {/* Fine Radial Circuit Traces from Orb to Nodes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1="22%"
                y1="22%"
                x2="50%"
                y2="50%"
                stroke="rgba(56, 189, 248, 0.45)"
                strokeWidth="1.3"
                strokeDasharray="4 4"
              />
              <line
                x1="78%"
                y1="22%"
                x2="50%"
                y2="50%"
                stroke="rgba(168, 85, 247, 0.45)"
                strokeWidth="1.3"
                strokeDasharray="4 4"
              />
              <line
                x1="22%"
                y1="78%"
                x2="50%"
                y2="50%"
                stroke="rgba(16, 185, 129, 0.45)"
                strokeWidth="1.3"
                strokeDasharray="4 4"
              />
              <line
                x1="78%"
                y1="78%"
                x2="50%"
                y2="50%"
                stroke="rgba(244, 114, 182, 0.45)"
                strokeWidth="1.3"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Node 1: Git Repos (Top Left) */}
            <div className="absolute top-2 left-2 px-2.5 py-1.5 rounded-xl bg-[#0f172a] border border-white/10 shadow-md flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Git Commits</span>
            </div>

            {/* Node 2: Specs & Docs (Top Right) */}
            <div className="absolute top-2 right-2 px-2.5 py-1.5 rounded-xl bg-[#0f172a] border border-white/10 shadow-md flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Specs &amp; PRDs</span>
            </div>

            {/* Node 3: PostgreSQL Data (Bottom Left) */}
            <div className="absolute bottom-2 left-2 px-2.5 py-1.5 rounded-xl bg-[#0f172a] border border-white/10 shadow-md flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tenant DB</span>
            </div>

            {/* Node 4: Team Discussions (Bottom Right) */}
            <div className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-xl bg-[#0f172a] border border-white/10 shadow-md flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
              <span>Channels</span>
            </div>

            {/* Central Holographic Neural Core */}
            <button
              type="button"
              onClick={() => setKnowledgeActive(!knowledgeActive)}
              className="relative w-22 h-22 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 shadow-[0_0_45px_rgba(56,189,248,0.65)] hover:shadow-[0_0_65px_rgba(56,189,248,0.95)] flex items-center justify-center hover:scale-108 active:scale-95 transition-all cursor-pointer z-10 group/orb"
              title="Click to query live knowledge base"
            >
              <div
                className="absolute inset-0 rounded-full bg-white/25 animate-ping pointer-events-none"
                style={{ animationDuration: '3s' }}
              />
              <Bot className="w-9 h-9 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
            </button>

            {/* Interactive Feedback Overlay */}
            {knowledgeActive && (
              <div className="absolute inset-x-2 bottom-1 py-2 px-3 rounded-xl bg-zinc-950/98 border border-cyan-500/50 text-[11px] text-cyan-200 flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-20">
                <span className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Synthesized answers across 24 commits &amp; 3 project specs!</span>
                </span>
                <button
                  type="button"
                  onClick={() => setKnowledgeActive(false)}
                  className="text-zinc-400 hover:text-white ml-2 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="pt-4 space-y-1.5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Autonomous Knowledge Mesh</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              Instant answers synthesized directly from your code commits, project PRDs, database schemas, and team channel threads.
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            CARD 2: Automated Work Breakdown (Sprint Ticket Decomposer)
           ------------------------------------------------------------------- */}
        <div className="p-7 rounded-3xl bg-[#080d1a]/95 border border-white/[0.08] shadow-2xl hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
          {/* Subtle Ambient Corner Glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

          {/* Top Visual Area (Interactive Sprint Decomposer Console) */}
          <div className="relative h-64 w-full flex flex-col items-center justify-center select-none">
            {/* Visual Workflow Node Connectors */}
            <div className="w-full flex items-center justify-between px-3 mb-6 relative">
              <div className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-[10px] font-mono text-zinc-300 flex items-center gap-1">
                <FileText className="w-3 h-3 text-indigo-400" />
                <span>Feature Brief</span>
              </div>

              <div className="flex-1 h-0.5 mx-2 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 relative">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              </div>

              <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>3 Sprints Ready</span>
              </div>
            </div>

            {/* Tactile High-Contrast Synthesize Button */}
            <button
              type="button"
              onClick={handleSynthesizeSprint}
              disabled={isSynthesizing}
              className="relative px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-[0_0_35px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_rgba(56,189,248,0.8)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer z-10 group/btn"
            >
              <Sparkles className={`w-4 h-4 text-white ${isSynthesizing ? 'animate-spin' : 'group-hover/btn:rotate-12 transition-transform'}`} />
              <span>{isSynthesizing ? 'Synthesizing Sprint...' : 'Synthesize Sprint Tickets'}</span>
            </button>

            {/* Live Feedback Toast */}
            {tasksGenerated && (
              <div className="absolute inset-x-2 bottom-1 py-2 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-[11px] text-emerald-200 flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold truncate">
                  3 Kanban tasks, acceptance criteria &amp; assignees mapped!
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="pt-4 space-y-1.5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Automated Work Breakdown</span>
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              Deconstruct complex PRDs and customer requirements into detailed Kanban tickets with test criteria, assignees, and velocity points.
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            CARD 3: Autonomous Standup & Executive CatchUp (Pure Telemetry - Zero Voice)
           ------------------------------------------------------------------- */}
        <div className="p-7 rounded-3xl bg-[#080d1a]/95 border border-white/[0.08] shadow-2xl hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
          {/* Subtle Ambient Corner Glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />

          {/* Top Visual Area (Interactive Executive Telemetry & Standup Digest) */}
          <div className="relative h-64 w-full flex flex-col justify-between select-none py-1">
            {/* Top Telemetry KPI Badges */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-[10px] font-mono text-purple-300 flex items-center gap-1.5 font-bold">
                <TrendingUp className="w-3 h-3 text-purple-400" />
                <span>Velocity +28% WoW</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>0 Blockers</span>
              </span>
            </div>

            {/* Standup Digest Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-purple-500/30 space-y-2 shadow-xl my-auto">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-white">Daily Standup Digest</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">09:00 AM Auto-Run</span>
              </div>

              <div className="space-y-1.5 text-[11px] text-zinc-300">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="leading-tight">
                    <strong className="text-white">Yesterday:</strong> 14 PRs merged across Auth, Multi-tenant DB &amp; Dark Theme.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span className="leading-tight">
                    <strong className="text-white">Today:</strong> P95 latency stress tests &amp; staging sign-off.
                  </span>
                </div>
              </div>
            </div>

            {/* Glowing Interactive CatchUp Button */}
            <button
              type="button"
              onClick={() => setStandupGenerated(!standupGenerated)}
              className="w-full py-2.5 rounded-xl bg-[#110f22] border border-purple-500/60 hover:border-pink-400 text-white font-bold text-xs shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(236,72,153,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group/pill"
            >
              <Zap className="w-3.5 h-3.5 text-pink-400" />
              <span>{standupGenerated ? 'Re-Sync Standup Digest' : 'Generate Instant CatchUp'}</span>
            </button>
          </div>

          {/* Description */}
          <div className="pt-4 space-y-1.5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Autonomous Standup &amp; Telemetry</span>
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              Autonomous daily standup synthesis and milestone velocity telemetry to keep your entire team aligned without meetings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
