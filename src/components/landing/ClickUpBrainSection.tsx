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
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#d946ef" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.15" />
            </linearGradient>

            <linearGradient id="pcb-trace-subtle" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.1" />
            </linearGradient>

            <filter id="via-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ===== TOP TITLE FRAMING TRACES ===== */}
          {/* Top Left Arc Trace */}
          <path
            d="M 280,105 L 360,105 L 400,65 L 530,65"
            fill="none"
            stroke="url(#pcb-trace-purple)"
            strokeWidth="1.5"
          />
          <circle cx="280" cy="105" r="3.5" fill="#a855f7" filter="url(#via-glow)" />

          {/* Top Right Arc Trace */}
          <path
            d="M 920,105 L 840,105 L 800,65 L 670,65"
            fill="none"
            stroke="url(#pcb-trace-purple)"
            strokeWidth="1.5"
          />
          <circle cx="920" cy="105" r="3.5" fill="#d946ef" filter="url(#via-glow)" />

          {/* ===== LEFT FLANK PARALLEL TRACES ===== */}
          {/* Track L1 (Outer) */}
          <path
            d="M 40,240 L 90,240 L 120,270 L 120,440 L 80,480 L 40,480"
            fill="none"
            stroke="url(#pcb-trace-purple)"
            strokeWidth="1.6"
          />
          <circle cx="40" cy="240" r="3" fill="#a855f7" />
          <circle cx="40" cy="480" r="3" fill="#a855f7" />

          {/* Track L2 (Middle) */}
          <path
            d="M 70,200 L 125,200 L 155,230 L 155,470 L 125,500 L 70,500"
            fill="none"
            stroke="url(#pcb-trace-subtle)"
            strokeWidth="1.4"
          />

          {/* Track L3 (Feeding towards Card 1 top) */}
          <path
            d="M 155,230 L 210,175 L 290,175"
            fill="none"
            stroke="url(#pcb-trace-purple)"
            strokeWidth="1.4"
          />
          <circle cx="290" cy="175" r="3" fill="#ec4899" filter="url(#via-glow)" />

          {/* ===== RIGHT FLANK PARALLEL TRACES ===== */}
          {/* Track R1 (Outer) */}
          <path
            d="M 1160,240 L 1110,240 L 1080,270 L 1080,440 L 1120,480 L 1160,480"
            fill="none"
            stroke="url(#pcb-trace-purple)"
            strokeWidth="1.6"
          />
          <circle cx="1160" cy="240" r="3" fill="#d946ef" />
          <circle cx="1160" cy="480" r="3" fill="#d946ef" />

          {/* Track R2 (Middle) */}
          <path
            d="M 1130,200 L 1075,200 L 1045,230 L 1045,470 L 1075,500 L 1130,500"
            fill="none"
            stroke="url(#pcb-trace-subtle)"
            strokeWidth="1.4"
          />

          {/* Track R3 (Feeding towards Card 3 top) */}
          <path
            d="M 1045,230 L 990,175 L 910,175"
            fill="none"
            stroke="url(#pcb-trace-purple)"
            strokeWidth="1.4"
          />
          <circle cx="910" cy="175" r="3" fill="#a855f7" filter="url(#via-glow)" />

          {/* ===== BOTTOM INTER-CARD BUS TRACES ===== */}
          <path
            d="M 340,610 L 460,610 L 490,640 L 710,640 L 740,610 L 860,610"
            fill="none"
            stroke="url(#pcb-trace-subtle)"
            strokeWidth="1.4"
            strokeDasharray="6 4"
          />
          <circle cx="490" cy="640" r="3" fill="#a855f7" />
          <circle cx="710" cy="640" r="3" fill="#ec4899" />
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
