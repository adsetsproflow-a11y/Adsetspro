'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Rocket,
  FolderGit2,
  HardDrive,
  Megaphone,
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
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 overflow-visible">
      {/* =====================================================================
          1. CIRCUIT BOARD / MOTHERBOARD BACKGROUND TRACES (OUTSIDE THE CARDS)
         ===================================================================== */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-10"
      >
        {/* Ambient Center Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-gradient-to-r from-purple-600/15 via-pink-600/10 to-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-pink-500/10 rounded-full blur-[90px]" />

        {/* Dynamic Motherboard Trace Lines */}
        <svg
          className="w-full h-full opacity-60 dark:opacity-75"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 650"
        >
          <defs>
            <linearGradient id="circuit-wire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="cyan-wire-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
            </linearGradient>

            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Motherboard Wave Traces around cards */}
          <path
            d="M 600,0 L 600,70 L 480,110 L 160,110 L 110,160 L 110,480 L 170,540 L 400,540"
            fill="none"
            stroke="url(#circuit-wire-grad)"
            strokeWidth="1.8"
            strokeDasharray="6 4"
          />
          <path
            d="M 600,0 L 600,70 L 720,110 L 1040,110 L 1090,160 L 1090,480 L 1030,540 L 800,540"
            fill="none"
            stroke="url(#circuit-wire-grad)"
            strokeWidth="1.8"
            strokeDasharray="6 4"
          />
          <path
            d="M 40,240 L 90,240 L 110,260 L 110,440 L 80,470 L 40,470"
            fill="none"
            stroke="url(#cyan-wire-grad)"
            strokeWidth="1.5"
          />
          <path
            d="M 1160,240 L 1110,240 L 1090,260 L 1090,440 L 1120,470 L 1160,470"
            fill="none"
            stroke="url(#cyan-wire-grad)"
            strokeWidth="1.5"
          />

          {/* Symmetrical Bottom Bus Bar */}
          <path
            d="M 320,580 L 460,580 L 490,610 L 710,610 L 740,580 L 880,580"
            fill="none"
            stroke="rgba(236, 72, 153, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="8 6"
          />

          {/* Glowing Junction Nodes (Soldering Rings) */}
          <circle cx="110" cy="160" r="4.5" fill="#ec4899" filter="url(#neon-glow)" />
          <circle cx="1090" cy="160" r="4.5" fill="#a855f7" filter="url(#neon-glow)" />
          <circle cx="480" cy="110" r="3.5" fill="#6366f1" />
          <circle cx="720" cy="110" r="3.5" fill="#ec4899" />
          <circle cx="170" cy="540" r="4" fill="#06b6d4" filter="url(#neon-glow)" />
          <circle cx="1030" cy="540" r="4" fill="#d946ef" filter="url(#neon-glow)" />
          <circle cx="490" cy="610" r="3" fill="#a855f7" />
          <circle cx="710" cy="610" r="3" fill="#38bdf8" />
        </svg>
      </div>

      {/* =====================================================================
          2. SECTION HEADER (CLICKUP BRAIN BADGE & TITLE)
         ===================================================================== */}
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-purple-500/30 text-xs font-bold shadow-lg shadow-purple-500/10">
          <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 font-extrabold tracking-wide">
            ClickUp Brain
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
          Get 10x more done with AI that’s your productivity partner
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Autonomous task synthesis, instantaneous project knowledge recall, and automated team workload alignment.
        </p>
      </div>

      {/* =====================================================================
          3. THREE CLICKUP BRAIN FEATURE CARDS (MATCHING 2ND REFERENCE IMAGE)
         ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {/* -------------------------------------------------------------------
            CARD 1: Ask AI (Central Orb with Branching App Integrations)
           ------------------------------------------------------------------- */}
        <div className="p-7 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#110f1c]/95 dark:to-[#08070e]/98 border border-slate-200 dark:border-white/[0.08] shadow-2xl hover:border-pink-500/50 dark:hover:border-pink-500/50 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
          {/* Subtle Ambient Aura */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/25 transition-all" />

          {/* Top Visual Stage (Full Integrated Surface - No Inner Box) */}
          <div className="relative h-64 w-full flex items-center justify-center select-none">
            {/* Fine Radial Circuit Web (Dashed Synapse Traces) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1="22%"
                y1="22%"
                x2="50%"
                y2="50%"
                stroke="rgba(236, 72, 153, 0.45)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <line
                x1="78%"
                y1="22%"
                x2="50%"
                y2="50%"
                stroke="rgba(168, 85, 247, 0.45)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <line
                x1="22%"
                y1="78%"
                x2="50%"
                y2="50%"
                stroke="rgba(6, 182, 212, 0.45)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <line
                x1="78%"
                y1="78%"
                x2="50%"
                y2="50%"
                stroke="rgba(16, 185, 129, 0.45)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Badge 1: Launch (Top Left) */}
            <div className="absolute top-2 left-2 px-3 py-1 rounded-xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 shadow-md flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Launch</span>
            </div>

            {/* Badge 2: GitHub (Top Right) */}
            <div className="absolute top-2 right-2 p-2 rounded-xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 shadow-md text-slate-800 dark:text-zinc-200">
              <FolderGit2 className="w-4 h-4 text-purple-400" />
            </div>

            {/* Badge 3: Google Drive (Bottom Left) */}
            <div className="absolute bottom-2 left-2 p-2 rounded-xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 shadow-md text-slate-800 dark:text-zinc-200">
              <HardDrive className="w-4 h-4 text-cyan-400" />
            </div>

            {/* Badge 4: Campaign (Bottom Right) */}
            <div className="absolute bottom-2 right-2 px-3 py-1 rounded-xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 shadow-md flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              <span>Campaign</span>
            </div>

            {/* Center Luminous Brain Orb (Hot Pink Pulsing Core) */}
            <button
              type="button"
              onClick={() => setAskAiActive(!askAiActive)}
              className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-purple-600 shadow-[0_0_45px_rgba(236,72,153,0.65)] hover:shadow-[0_0_60px_rgba(236,72,153,0.9)] flex items-center justify-center hover:scale-108 active:scale-95 transition-all cursor-pointer z-10 group/orb"
              title="Click to query AI knowledge base"
            >
              <div
                className="absolute inset-0 rounded-full bg-white/25 animate-ping pointer-events-none"
                style={{ animationDuration: '3.5s' }}
              />
              <Sparkles className="w-8 h-8 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.95)]" />
            </button>

            {/* Interactive Query Feedback Overlay */}
            {askAiActive && (
              <div className="absolute inset-x-2 bottom-1 py-1.5 px-3 rounded-xl bg-zinc-950/95 border border-pink-500/50 text-[10px] text-pink-300 flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-bottom-2 z-20">
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
          <div className="pt-4 space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ask AI.</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              Get the right answer right away, using knowledge from ClickUp and any connected apps.
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            CARD 2: AI Task Creation (Motherboard Grid & Solid White Pill)
           ------------------------------------------------------------------- */}
        <div className="p-7 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#110f1c]/95 dark:to-[#08070e]/98 border border-slate-200 dark:border-white/[0.08] shadow-2xl hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
          {/* Subtle Ambient Aura */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/25 transition-all" />

          {/* Top Visual Stage (Full Integrated Surface with Chip Traces) */}
          <div className="relative h-64 w-full flex items-center justify-center select-none">
            {/* Integrated Circuit Chip Grid behind button */}
            <svg
              className="absolute inset-0 w-full h-full opacity-35 dark:opacity-45 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 300 240"
            >
              <path
                d="M 30,50 L 110,50 L 110,120 L 190,120 L 190,50 L 270,50"
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.2"
              />
              <path
                d="M 50,190 L 110,190 L 110,140 L 190,140 L 190,190 L 250,190"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1.2"
              />
              <line x1="150" y1="20" x2="150" y2="85" stroke="#a855f7" strokeWidth="1.2" strokeDasharray="3 3" />
              <line x1="150" y1="155" x2="150" y2="220" stroke="#ec4899" strokeWidth="1.2" strokeDasharray="3 3" />
              <circle cx="110" cy="50" r="3" fill="#6366f1" />
              <circle cx="190" cy="50" r="3" fill="#8b5cf6" />
              <circle cx="110" cy="190" r="3" fill="#ec4899" />
              <circle cx="190" cy="190" r="3" fill="#38bdf8" />
            </svg>

            {/* Solid Luminous White CTA Pill: ✨ Create Task */}
            <button
              type="button"
              onClick={handleCreateTask}
              className="relative px-6 py-3 rounded-2xl bg-white text-zinc-950 font-bold text-xs sm:text-sm shadow-[0_0_35px_rgba(255,255,255,0.6)] hover:shadow-[0_0_50px_rgba(255,255,255,0.9)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer z-10 group/btn"
            >
              <Sparkles className="w-4 h-4 text-pink-600 fill-pink-600 group-hover/btn:rotate-12 transition-transform" />
              <span>Create Task</span>
            </button>

            {/* Task Generation Toast Feedback */}
            {taskCreatedToast && (
              <div className="absolute inset-x-2 bottom-1 py-1.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-[10px] text-emerald-300 flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 z-20">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold truncate">
                  Task &apos;Stripe Webhook Listener&apos; assigned to Suriya Prakash!
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="pt-4 space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Task Creation.</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              Action items automatically created, assigned, and linked.
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            CARD 3: AI CatchUp (Resonant Frequency Waves & Catch Me Up Pill)
           ------------------------------------------------------------------- */}
        <div className="p-7 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#110f1c]/95 dark:to-[#08070e]/98 border border-slate-200 dark:border-white/[0.08] shadow-2xl hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
          {/* Subtle Ambient Aura */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/25 transition-all" />

          {/* Top Visual Stage (Full Integrated Surface with Audio Resonance Waves) */}
          <div className="relative h-64 w-full flex flex-col items-center justify-center select-none">
            {/* Top Frequency Resonance Line */}
            <div className="w-28 h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-4" />

            {/* Audio Wave Equalizer Bars */}
            <div className="flex items-center gap-1.5 mb-4">
              <span className="w-1 h-3 rounded-full bg-purple-500 animate-pulse" style={{ animationDuration: '1.2s' }} />
              <span className="w-1 h-6 rounded-full bg-pink-500 animate-pulse" style={{ animationDuration: '0.8s' }} />
              <span className="w-1 h-9 rounded-full bg-cyan-400 animate-pulse" style={{ animationDuration: '1.5s' }} />
              <span className="w-1 h-5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDuration: '1.0s' }} />
              <span className="w-1 h-3 rounded-full bg-pink-400 animate-pulse" style={{ animationDuration: '1.3s' }} />
            </div>

            {/* Glowing Catch Me Up Pill Button */}
            <button
              type="button"
              onClick={() => setCatchUpActive(!catchUpActive)}
              className="relative px-6 py-2.5 rounded-full bg-zinc-950 border border-purple-500/60 hover:border-pink-400 text-white font-bold text-xs sm:text-sm shadow-[0_0_30px_rgba(168,85,247,0.45)] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer z-10 group/pill"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400 fill-pink-400 group-hover/pill:rotate-12 transition-transform" />
              <span>Catch me up</span>
            </button>

            {/* Bottom Frequency Resonance Line */}
            <div className="w-36 h-0.5 bg-gradient-to-r from-transparent via-pink-500/40 to-transparent mt-4" />

            {/* Interactive Catch Up Briefing Overlay */}
            {catchUpActive && (
              <div className="absolute inset-x-2 bottom-1 py-1.5 px-3 rounded-xl bg-zinc-950/95 border border-purple-500/50 text-[10px] text-purple-200 space-y-0.5 shadow-xl animate-in fade-in slide-in-from-bottom-2 z-20">
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
          <div className="pt-4 space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI CatchUp.</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              Get up to speed instantly on important topics and action items.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
