'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  FolderGit2,
  CheckCircle2,
  Check,
} from 'lucide-react';

export default function ClickUpBrainSection() {
  const [askAiActive, setAskAiActive] = useState(false);
  const [taskCreatedToast, setTaskCreatedToast] = useState(false);
  const [catchUpActive, setCatchUpActive] = useState(false);

  const handleCreateTask = () => {
    setTaskCreatedToast(true);
    setTimeout(() => setTaskCreatedToast(false), 3500);
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 overflow-visible my-12">
      {/* =====================================================================
          1. CIRCUIT BOARD MOTHERBOARD TRACES (OUTSIDE & BEHIND THE CARDS)
         ===================================================================== */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-visible select-none -z-10"
      >
        {/* Soft Ambient Center Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-r from-purple-900/15 via-pink-900/10 to-indigo-900/15 rounded-full blur-[140px]" />
        <div className="absolute top-16 left-1/4 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-16 right-1/4 w-[350px] h-[350px] bg-pink-600/10 rounded-full blur-[100px]" />

        {/* Authentic Geometric PCB Circuit Traces */}
        <svg
          className="w-full h-full opacity-60 dark:opacity-80"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 680"
        >
          <defs>
            <linearGradient id="pcb-trace-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#d946ef" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="pcb-trace-subtle" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.25" />
            </linearGradient>

            <linearGradient id="fade-horizontal-right" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="fade-horizontal-left" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>

            <filter id="via-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle Tech PCB Background Grid */}
            <pattern id="pcb-grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(168, 85, 247, 0.05)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#pcb-grid-pattern)" opacity="0.8" />

          {/* ===== TOP TITLE FRAMING TRACES ===== */}
          {/* Top Left Title Trace */}
          <path
            d="M 220,110 L 320,110 L 360,65 L 500,65"
            fill="none"
            stroke="url(#pcb-trace-purple)"
            strokeWidth="1.8"
          />
          <circle cx="220" cy="110" r="4" fill="#a855f7" filter="url(#via-glow)" />
          <circle cx="220" cy="110" r="1.8" fill="#ffffff" />

          {/* Top Right Title Trace */}
          <path
            d="M 980,110 L 880,110 L 840,65 L 700,65"
            fill="none"
            stroke="url(#pcb-trace-purple)"
            strokeWidth="1.8"
          />
          <circle cx="980" cy="110" r="4" fill="#d946ef" filter="url(#via-glow)" />
          <circle cx="980" cy="110" r="1.8" fill="#ffffff" />

          {/* ===================================================================
              LEFT FLANK CIRCUIT TRACES (EXACT DESIGN MATCH)
             =================================================================== */}

          {/* 1. Solid Trace with 45° Branch & Magenta Circular Node (Image 1) */}
          {/* Vertical Bus Line */}
          <path
            d="M 55,340 L 55,190"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="1.75"
            strokeOpacity="0.75"
          />
          {/* Upper 45° diagonal branch ending in fading horizontal segment */}
          <path
            d="M 55,230 L 100,185 L 165,185"
            fill="none"
            stroke="url(#fade-horizontal-right)"
            strokeWidth="1.75"
          />
          {/* Lower parallel 45° branch terminating in glowing magenta via dot */}
          <path
            d="M 35,305 L 80,260 L 160,260"
            fill="none"
            stroke="url(#pcb-trace-purple)"
            strokeWidth="1.8"
          />
          <circle cx="160" cy="260" r="4.5" fill="#d946ef" filter="url(#via-glow)" />
          <circle cx="160" cy="260" r="2" fill="#ffffff" opacity="0.9" />

          {/* 2. Dashed Trace with 45° Riser & Pink Via Node (Image 2) */}
          <path
            d="M 20,380 L 95,380"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.8"
            strokeDasharray="7 5"
            strokeOpacity="0.8"
          />
          <circle cx="95" cy="380" r="4" fill="#ec4899" filter="url(#via-glow)" />
          <circle cx="95" cy="380" r="1.8" fill="#ffffff" />
          <path
            d="M 95,380 L 135,340 L 210,340"
            fill="none"
            stroke="#ec4899"
            strokeWidth="1.8"
            strokeDasharray="7 5"
            strokeOpacity="0.85"
          />

          {/* 3. Outer Left Motherboard Contour Bus */}
          <path
            d="M 25,140 L 45,140 L 70,165 L 70,490 L 45,515 L 20,515"
            fill="none"
            stroke="url(#pcb-trace-subtle)"
            strokeWidth="1.5"
          />
          <circle cx="25" cy="140" r="3" fill="#a855f7" />
          <circle cx="20" cy="515" r="3" fill="#a855f7" />

          {/* ===================================================================
              RIGHT FLANK CIRCUIT TRACES (SYMMETRICALLY MIRRORED)
             =================================================================== */}

          {/* 1. Solid Trace with 45° Branch & Magenta Circular Node (Image 1 Mirrored) */}
          {/* Vertical Bus Line */}
          <path
            d="M 1145,340 L 1145,190"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="1.75"
            strokeOpacity="0.75"
          />
          {/* Upper 45° diagonal branch ending in fading horizontal segment */}
          <path
            d="M 1145,230 L 1100,185 L 1035,185"
            fill="none"
            stroke="url(#fade-horizontal-left)"
            strokeWidth="1.75"
          />
          {/* Lower parallel 45° branch terminating in glowing magenta via dot */}
          <path
            d="M 1165,305 L 1120,260 L 1040,260"
            fill="none"
            stroke="url(#pcb-trace-purple)"
            strokeWidth="1.8"
          />
          <circle cx="1040" cy="260" r="4.5" fill="#d946ef" filter="url(#via-glow)" />
          <circle cx="1040" cy="260" r="2" fill="#ffffff" opacity="0.9" />

          {/* 2. Dashed Trace with 45° Riser & Pink Via Node (Image 2 Mirrored) */}
          <path
            d="M 1180,380 L 1105,380"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.8"
            strokeDasharray="7 5"
            strokeOpacity="0.8"
          />
          <circle cx="1105" cy="380" r="4" fill="#ec4899" filter="url(#via-glow)" />
          <circle cx="1105" cy="380" r="1.8" fill="#ffffff" />
          <path
            d="M 1105,380 L 1065,340 L 990,340"
            fill="none"
            stroke="#ec4899"
            strokeWidth="1.8"
            strokeDasharray="7 5"
            strokeOpacity="0.85"
          />

          {/* 3. Outer Right Motherboard Contour Bus */}
          <path
            d="M 1175,140 L 1155,140 L 1130,165 L 1130,490 L 1155,515 L 1180,515"
            fill="none"
            stroke="url(#pcb-trace-subtle)"
            strokeWidth="1.5"
          />
          <circle cx="1175" cy="140" r="3" fill="#d946ef" />
          <circle cx="1180" cy="515" r="3" fill="#d946ef" />

          {/* ===== BOTTOM INTER-CARD BUS TRACES ===== */}
          <path
            d="M 300,625 L 440,625 L 470,650 L 730,650 L 760,625 L 900,625"
            fill="none"
            stroke="url(#pcb-trace-subtle)"
            strokeWidth="1.6"
            strokeDasharray="7 5"
          />
          <circle cx="470" cy="650" r="3.5" fill="#a855f7" filter="url(#via-glow)" />
          <circle cx="730" cy="650" r="3.5" fill="#ec4899" filter="url(#via-glow)" />
          <circle cx="300" cy="625" r="3" fill="#a855f7" />
          <circle cx="900" cy="625" r="3" fill="#d946ef" />
        </svg>
      </div>

      {/* =====================================================================
          2. SECTION HEADER (CLICKUP BRAIN BADGE & TITLE)
         ===================================================================== */}
      <div className="text-center space-y-4 max-w-4xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 font-bold tracking-wide">
            ClickUp Brain
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
          Get 10x more done with AI that’s your productivity partner
        </h2>
      </div>

      {/* =====================================================================
          3. THREE CLICKUP BRAIN FEATURE CARDS (EXACT MIRROR OF 2ND IMAGE)
         ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {/* -------------------------------------------------------------------
            CARD 1: Ask AI. (Central Glowing Pink/White Sphere & App Badges)
           ------------------------------------------------------------------- */}
        <div className="p-7 rounded-3xl bg-[#0b0a13]/90 border border-white/[0.07] shadow-2xl hover:border-pink-500/40 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
          {/* Subtle Ambient Corner Glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-pink-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/20 transition-all" />

          {/* Top Visual Area (Synapse Wiring to 4 Badges) */}
          <div className="relative h-64 w-full flex items-center justify-center select-none">
            {/* Fine Radial Circuit Traces from Orb to Badges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1="22%"
                y1="22%"
                x2="50%"
                y2="50%"
                stroke="rgba(236, 72, 153, 0.45)"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <line
                x1="78%"
                y1="22%"
                x2="50%"
                y2="50%"
                stroke="rgba(168, 85, 247, 0.45)"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <line
                x1="22%"
                y1="78%"
                x2="50%"
                y2="50%"
                stroke="rgba(6, 182, 212, 0.45)"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <line
                x1="78%"
                y1="78%"
                x2="50%"
                y2="50%"
                stroke="rgba(16, 185, 129, 0.45)"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Badge 1: Launch (Top Left) */}
            <div className="absolute top-2 left-2 px-3 py-1.5 rounded-xl bg-[#161424] border border-white/[0.08] shadow-md flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
              <span>Launch</span>
            </div>

            {/* Badge 2: GitHub (Top Right) */}
            <div className="absolute top-2 right-2 p-2 rounded-xl bg-[#161424] border border-white/[0.08] shadow-md text-zinc-200">
              <FolderGit2 className="w-4 h-4 text-purple-300" />
            </div>

            {/* Badge 3: Google Drive (Bottom Left) */}
            <div className="absolute bottom-2 left-2 p-2 rounded-xl bg-[#161424] border border-white/[0.08] shadow-md text-zinc-200 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M8.5 3L1.5 15L5 21L12 9L8.5 3Z" fill="#38bdf8" />
                <path d="M15.5 3L8.5 15L12 21L19 9L15.5 3Z" fill="#eab308" />
                <path d="M15.5 21H8.5L12 15H19L15.5 21Z" fill="#10b981" />
              </svg>
            </div>

            {/* Badge 4: Campaign (Bottom Right) */}
            <div className="absolute bottom-2 right-2 px-3 py-1.5 rounded-xl bg-[#161424] border border-white/[0.08] shadow-md flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
              </span>
              <span>Campaign</span>
            </div>

            {/* Central Glowing Orb (White / Light-Pink Core with Sparkles) */}
            <button
              type="button"
              onClick={() => setAskAiActive(!askAiActive)}
              className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#fbcfe8] via-[#f472b6] to-[#ec4899] shadow-[0_0_40px_rgba(244,114,182,0.65)] hover:shadow-[0_0_55px_rgba(244,114,182,0.9)] flex items-center justify-center hover:scale-108 active:scale-95 transition-all cursor-pointer z-10 group/orb"
              title="Click to query AI knowledge base"
            >
              <div
                className="absolute inset-0 rounded-full bg-white/30 animate-ping pointer-events-none"
                style={{ animationDuration: '3.5s' }}
              />
              <Sparkles className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
            </button>

            {/* Interactive Feedback Overlay */}
            {askAiActive && (
              <div className="absolute inset-x-2 bottom-1 py-1.5 px-3 rounded-xl bg-zinc-950/98 border border-pink-500/50 text-[10px] text-pink-300 flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-bottom-2 z-20">
                <span className="font-semibold">✨ Pulled 4 action items across active sprints</span>
                <button
                  type="button"
                  onClick={() => setAskAiActive(false)}
                  className="text-zinc-400 hover:text-white ml-1 font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="pt-4 space-y-1.5">
            <h3 className="text-xl font-bold text-white">Ask AI.</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              Get the right answer right away, using knowledge from ClickUp and any connected apps.
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            CARD 2: AI Task Creation. (Exact 4-Quadrant Circuit Grid & White Pill)
           ------------------------------------------------------------------- */}
        <div className="p-7 rounded-3xl bg-[#0b0a13]/90 border border-white/[0.07] shadow-2xl hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
          {/* Subtle Ambient Corner Glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />

          {/* Top Visual Area with 4-Quadrant PCB Grid */}
          <div className="relative h-64 w-full flex items-center justify-center select-none">
            {/* The Exact 4-Quadrant Rounded PCB Circuit Tracks from Reference Image */}
            <svg
              className="absolute inset-0 w-full h-full opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 300 240"
            >
              {/* Central Crosshair Tracks */}
              <line x1="150" y1="15" x2="150" y2="225" stroke="#a855f7" strokeWidth="1.5" />
              <line x1="20" y1="120" x2="280" y2="120" stroke="#a855f7" strokeWidth="1.5" />

              {/* Quadrant 1 (Top-Left) Rounded Box Frame */}
              <rect
                x="45"
                y="30"
                width="90"
                height="75"
                rx="14"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1.5"
              />

              {/* Quadrant 2 (Top-Right) Rounded Box Frame */}
              <rect
                x="165"
                y="30"
                width="90"
                height="75"
                rx="14"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1.5"
              />

              {/* Quadrant 3 (Bottom-Left) Rounded Box Frame */}
              <rect
                x="45"
                y="135"
                width="90"
                height="75"
                rx="14"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1.5"
              />

              {/* Quadrant 4 (Bottom-Right) Rounded Box Frame */}
              <rect
                x="165"
                y="135"
                width="90"
                height="75"
                rx="14"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1.5"
              />

              {/* Solder Via Nodes at Junctions */}
              <circle cx="150" cy="30" r="3" fill="#a855f7" />
              <circle cx="150" cy="210" r="3" fill="#a855f7" />
              <circle cx="45" cy="120" r="3" fill="#ec4899" />
              <circle cx="255" cy="120" r="3" fill="#ec4899" />
            </svg>

            {/* Solid Luminous Pure White CTA Pill: ✨ Create Task */}
            <button
              type="button"
              onClick={handleCreateTask}
              className="relative px-6 py-3 rounded-2xl bg-white text-zinc-950 font-bold text-xs sm:text-sm shadow-[0_0_35px_rgba(255,255,255,0.6)] hover:shadow-[0_0_55px_rgba(255,255,255,0.95)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer z-10 group/btn"
            >
              <Sparkles className="w-4 h-4 text-pink-600 fill-pink-600 group-hover/btn:rotate-12 transition-transform" />
              <span>Create Task</span>
            </button>

            {/* Task Created Toast Feedback */}
            {taskCreatedToast && (
              <div className="absolute inset-x-2 bottom-1 py-1.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-[10px] text-emerald-300 flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 z-20">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold truncate">
                  Task &apos;Stripe Webhook Listener&apos; created &amp; linked!
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="pt-4 space-y-1.5">
            <h3 className="text-xl font-bold text-white">AI Task Creation.</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              Action items automatically created, assigned, and linked.
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            CARD 3: AI CatchUp. (Resonant Wave Lines & Glowing Catch Me Up Pill)
           ------------------------------------------------------------------- */}
        <div className="p-7 rounded-3xl bg-[#0b0a13]/90 border border-white/[0.07] shadow-2xl hover:border-pink-500/40 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
          {/* Subtle Ambient Corner Glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />

          {/* Top Visual Area with Horizontal Frequency Wave Lines */}
          <div className="relative h-64 w-full flex flex-col items-center justify-center select-none">
            {/* Top 3 Frequency Resonance Wave Lines */}
            <div className="flex flex-col items-center gap-1.5 mb-5 opacity-70">
              <span className="w-24 h-0.5 rounded-full bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
              <span className="w-36 h-0.5 rounded-full bg-gradient-to-r from-transparent via-pink-400/70 to-transparent" />
              <span className="w-20 h-0.5 rounded-full bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            </div>

            {/* Glowing Catch Me Up Pill Button */}
            <button
              type="button"
              onClick={() => setCatchUpActive(!catchUpActive)}
              className="relative px-6 py-2.5 rounded-full bg-[#110f1c] border-2 border-purple-500/70 hover:border-pink-400 text-white font-bold text-xs sm:text-sm shadow-[0_0_28px_rgba(168,85,247,0.45)] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer z-10 group/pill"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400 fill-pink-400 group-hover/pill:rotate-12 transition-transform" />
              <span>Catch me up</span>
            </button>

            {/* Bottom 3 Frequency Resonance Wave Lines */}
            <div className="flex flex-col items-center gap-1.5 mt-5 opacity-70">
              <span className="w-20 h-0.5 rounded-full bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
              <span className="w-36 h-0.5 rounded-full bg-gradient-to-r from-transparent via-pink-400/70 to-transparent" />
              <span className="w-24 h-0.5 rounded-full bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
            </div>

            {/* Interactive Catch Up Briefing Overlay */}
            {catchUpActive && (
              <div className="absolute inset-x-2 bottom-1 py-1.5 px-3 rounded-xl bg-zinc-950/98 border border-purple-500/50 text-[10px] text-purple-200 space-y-0.5 shadow-xl animate-in fade-in slide-in-from-bottom-2 z-20">
                <div className="flex items-center justify-between font-bold text-purple-300">
                  <span>✨ 30-Second Morning Digest:</span>
                  <button
                    type="button"
                    onClick={() => setCatchUpActive(false)}
                    className="text-zinc-400 hover:text-white ml-1 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-zinc-400 text-[9px] truncate">• 2 review items awaiting approval</p>
                <p className="text-zinc-400 text-[9px] truncate">• Harish &amp; Praveen completed sprint kickoff</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="pt-4 space-y-1.5">
            <h3 className="text-xl font-bold text-white">AI CatchUp.</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              Get up to speed instantly on important topics and action items.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
