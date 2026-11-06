'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  FolderGit2,
  HardDrive,
  CheckCircle2,
  Check,
  Cpu,
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
    <section className="py-24 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto relative z-10 overflow-visible bg-[#07070c]/98 dark:bg-[#06050b] rounded-[42px] border border-white/[0.06] my-20 shadow-[0_0_100px_rgba(0,0,0,0.95)]">
      {/* =====================================================================
          1. CIRCUIT BOARD MOTHERBOARD TRACES & HARDWARE CONNECTION BOXES
         ===================================================================== */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-10 rounded-[42px]"
      >
        {/* Ambient Center Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-gradient-to-r from-purple-600/20 via-pink-600/15 to-indigo-600/20 rounded-full blur-[130px]" />
        <div className="absolute top-24 left-1/4 w-[380px] h-[380px] bg-pink-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-24 right-1/4 w-[380px] h-[380px] bg-cyan-500/10 rounded-full blur-[100px]" />

        {/* Dynamic Motherboard Trace Lines & Connection Chips */}
        <svg
          className="w-full h-full opacity-75 dark:opacity-90"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 700"
        >
          <defs>
            <linearGradient id="circuit-wire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="cyan-wire-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.25" />
            </linearGradient>

            <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ==================== UPPER BUS TRACES ==================== */}
          {/* Main Top Header Drop Lines */}
          <path
            d="M 600,0 L 600,55 L 450,90 L 230,90 L 195,125 L 195,175"
            fill="none"
            stroke="url(#circuit-wire-grad)"
            strokeWidth="2"
          />
          <path
            d="M 600,0 L 600,55 L 750,90 L 970,90 L 1005,125 L 1005,175"
            fill="none"
            stroke="url(#circuit-wire-grad)"
            strokeWidth="2"
          />
          <path
            d="M 600,55 L 600,165"
            fill="none"
            stroke="url(#cyan-wire-grad)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* ==================== CONNECTION BOXES (HARDWARE IC NODES) ==================== */}
          {/* Connection Box 1: Left Node (Above Card 1) */}
          <g transform="translate(165, 175)">
            <rect
              width="60"
              height="30"
              rx="6"
              fill="#0d0b17"
              stroke="#ec4899"
              strokeWidth="1.8"
              filter="url(#neon-glow)"
            />
            <rect x="6" y="6" width="48" height="18" rx="3" fill="#181329" stroke="#a855f7" strokeWidth="1" />
            <circle cx="15" cy="15" r="2.5" fill="#ec4899" />
            <circle cx="30" cy="15" r="2" fill="#ffffff" />
            <circle cx="45" cy="15" r="2.5" fill="#38bdf8" />
            {/* Solder Pins entering Card 1 */}
            <line x1="20" y1="30" x2="20" y2="45" stroke="#ec4899" strokeWidth="1.8" />
            <line x1="40" y1="30" x2="40" y2="45" stroke="#a855f7" strokeWidth="1.8" />
          </g>

          {/* Connection Box 2: Center Master Controller (Above Card 2) */}
          <g transform="translate(565, 165)">
            <rect
              width="70"
              height="36"
              rx="8"
              fill="#0d0b17"
              stroke="#38bdf8"
              strokeWidth="2"
              filter="url(#neon-glow)"
            />
            <rect x="8" y="7" width="54" height="22" rx="4" fill="#111827" stroke="#6366f1" strokeWidth="1" />
            <circle cx="20" cy="18" r="3" fill="#38bdf8" />
            <circle cx="35" cy="18" r="3" fill="#ffffff" />
            <circle cx="50" cy="18" r="3" fill="#ec4899" />
            {/* Bus Pins descending into Card 2 */}
            <line x1="25" y1="36" x2="25" y2="52" stroke="#38bdf8" strokeWidth="2" />
            <line x1="45" y1="36" x2="45" y2="52" stroke="#6366f1" strokeWidth="2" />
          </g>

          {/* Connection Box 3: Right Node (Above Card 3) */}
          <g transform="translate(975, 175)">
            <rect
              width="60"
              height="30"
              rx="6"
              fill="#0d0b17"
              stroke="#a855f7"
              strokeWidth="1.8"
              filter="url(#neon-glow)"
            />
            <rect x="6" y="6" width="48" height="18" rx="3" fill="#181329" stroke="#ec4899" strokeWidth="1" />
            <circle cx="15" cy="15" r="2.5" fill="#38bdf8" />
            <circle cx="30" cy="15" r="2" fill="#ffffff" />
            <circle cx="45" cy="15" r="2.5" fill="#a855f7" />
            {/* Solder Pins entering Card 3 */}
            <line x1="20" y1="30" x2="20" y2="45" stroke="#a855f7" strokeWidth="1.8" />
            <line x1="40" y1="30" x2="40" y2="45" stroke="#ec4899" strokeWidth="1.8" />
          </g>

          {/* ==================== LATERAL INTER-CARD BUS TIES ==================== */}
          {/* Card 1 to Card 2 Data Highway with Intermediate Chip */}
          <path
            d="M 380,360 L 410,360 L 425,375 L 425,410 L 440,425 L 455,425"
            fill="none"
            stroke="url(#circuit-wire-grad)"
            strokeWidth="1.8"
          />
          <g transform="translate(405, 370)">
            <rect width="24" height="24" rx="4" fill="#0f0c1b" stroke="#ec4899" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" fill="#ec4899" />
          </g>

          {/* Card 2 to Card 3 Data Highway with Intermediate Chip */}
          <path
            d="M 745,425 L 760,425 L 775,410 L 775,375 L 790,360 L 820,360"
            fill="none"
            stroke="url(#cyan-wire-grad)"
            strokeWidth="1.8"
          />
          <g transform="translate(770, 370)">
            <rect width="24" height="24" rx="4" fill="#0f0c1b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" fill="#38bdf8" />
          </g>

          {/* ==================== OUTER FLANK TRACES & POWER TERMINALS ==================== */}
          {/* Left Flank Rail */}
          <path
            d="M 60,180 L 110,180 L 130,200 L 130,520 L 95,555 L 60,555"
            fill="none"
            stroke="url(#cyan-wire-grad)"
            strokeWidth="1.8"
          />
          <g transform="translate(115, 340)">
            <rect width="30" height="40" rx="5" fill="#0c111d" stroke="#06b6d4" strokeWidth="1.5" />
            <line x1="8" y1="12" x2="22" y2="12" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="8" y1="20" x2="22" y2="20" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="8" y1="28" x2="22" y2="28" stroke="#38bdf8" strokeWidth="1.5" />
          </g>

          {/* Right Flank Rail */}
          <path
            d="M 1140,180 L 1090,180 L 1070,200 L 1070,520 L 1105,555 L 1140,555"
            fill="none"
            stroke="url(#circuit-wire-grad)"
            strokeWidth="1.8"
          />
          <g transform="translate(1055, 340)">
            <rect width="30" height="40" rx="5" fill="#140d1f" stroke="#ec4899" strokeWidth="1.5" />
            <line x1="8" y1="12" x2="22" y2="12" stroke="#f43f5e" strokeWidth="1.5" />
            <line x1="8" y1="20" x2="22" y2="20" stroke="#f43f5e" strokeWidth="1.5" />
            <line x1="8" y1="28" x2="22" y2="28" stroke="#f43f5e" strokeWidth="1.5" />
          </g>

          {/* ==================== BOTTOM SYSTEM BUS TERMINALS ==================== */}
          <path
            d="M 280,620 L 440,620 L 465,645 L 735,645 L 760,620 L 920,620"
            fill="none"
            stroke="rgba(236, 72, 153, 0.5)"
            strokeWidth="1.8"
            strokeDasharray="6 4"
          />
          {/* Bottom Solder Nodes */}
          <circle cx="465" cy="645" r="4" fill="#a855f7" filter="url(#neon-glow)" />
          <circle cx="735" cy="645" r="4" fill="#38bdf8" filter="url(#neon-glow)" />
          <circle cx="280" cy="620" r="3.5" fill="#ec4899" />
          <circle cx="920" cy="620" r="3.5" fill="#a855f7" />
        </svg>
      </div>

      {/* =====================================================================
          2. SECTION HEADER (CLICKUP BRAIN BADGE & TITLE)
         ===================================================================== */}
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-indigo-500/15 border border-purple-500/40 text-xs font-bold shadow-xl shadow-purple-500/10">
          <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 font-extrabold tracking-wide">
            ClickUp Brain
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
          Get 10x more done with AI that’s your productivity partner
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
          Autonomous task synthesis, instantaneous project knowledge recall, and automated team workload alignment.
        </p>
      </div>

      {/* =====================================================================
          3. THREE CLICKUP BRAIN FEATURE CARDS (EXACT REFERENCE 2ND IMAGE)
         ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {/* -------------------------------------------------------------------
            CARD 1: Ask AI (Central Pink Brain Sphere & Radiating App Badges)
           ------------------------------------------------------------------- */}
        <div className="p-7 rounded-3xl bg-gradient-to-b from-[#12101e]/98 to-[#090812]/99 border border-white/[0.09] shadow-2xl hover:border-pink-500/60 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
          {/* Ambient Corner Aura */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/30 transition-all" />

          {/* Top Visual Stage (Full Integrated Surface with Spiderweb Synapses) */}
          <div className="relative h-64 w-full flex items-center justify-center select-none">
            {/* Fine Radial Circuit Web */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1="22%"
                y1="22%"
                x2="50%"
                y2="50%"
                stroke="rgba(236, 72, 153, 0.55)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <line
                x1="78%"
                y1="22%"
                x2="50%"
                y2="50%"
                stroke="rgba(168, 85, 247, 0.55)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <line
                x1="22%"
                y1="78%"
                x2="50%"
                y2="50%"
                stroke="rgba(6, 182, 212, 0.55)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <line
                x1="78%"
                y1="78%"
                x2="50%"
                y2="50%"
                stroke="rgba(16, 185, 129, 0.55)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Badge 1: Launch (Top Left) */}
            <div className="absolute top-2 left-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-lg flex items-center gap-1.5 text-xs font-bold text-zinc-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
              <span>Launch</span>
            </div>

            {/* Badge 2: GitHub (Top Right) */}
            <div className="absolute top-2 right-2 p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-lg text-zinc-200">
              <FolderGit2 className="w-4 h-4 text-purple-400" />
            </div>

            {/* Badge 3: Google Drive (Bottom Left) */}
            <div className="absolute bottom-2 left-2 p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-lg text-zinc-200">
              <HardDrive className="w-4 h-4 text-cyan-400" />
            </div>

            {/* Badge 4: Campaign (Bottom Right) */}
            <div className="absolute bottom-2 right-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-lg flex items-center gap-1.5 text-xs font-bold text-zinc-200">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              <span>Campaign</span>
            </div>

            {/* Center Luminous Brain Orb (Hot Pink Pulsing Core) */}
            <button
              type="button"
              onClick={() => setAskAiActive(!askAiActive)}
              className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-purple-600 shadow-[0_0_45px_rgba(236,72,153,0.7)] hover:shadow-[0_0_65px_rgba(236,72,153,0.95)] flex items-center justify-center hover:scale-108 active:scale-95 transition-all cursor-pointer z-10 group/orb"
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
          <div className="pt-4 space-y-2">
            <h3 className="text-xl font-bold text-white">Ask AI.</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              Get the right answer right away, using knowledge from ClickUp and any connected apps.
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            CARD 2: AI Task Creation (Motherboard Grid & Solid White Pill)
           ------------------------------------------------------------------- */}
        <div className="p-7 rounded-3xl bg-gradient-to-b from-[#12101e]/98 to-[#090812]/99 border border-white/[0.09] shadow-2xl hover:border-indigo-500/60 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
          {/* Ambient Corner Aura */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/30 transition-all" />

          {/* Top Visual Stage with Circuit Tracks */}
          <div className="relative h-64 w-full flex items-center justify-center select-none">
            {/* Integrated Circuit Chip Grid behind button */}
            <svg
              className="absolute inset-0 w-full h-full opacity-45 dark:opacity-60 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 300 240"
            >
              <path
                d="M 30,50 L 110,50 L 110,120 L 190,120 L 190,50 L 270,50"
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.5"
              />
              <path
                d="M 50,190 L 110,190 L 110,140 L 190,140 L 190,190 L 250,190"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1.5"
              />
              <line x1="150" y1="15" x2="150" y2="85" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="150" y1="155" x2="150" y2="225" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="110" cy="50" r="3.5" fill="#6366f1" />
              <circle cx="190" cy="50" r="3.5" fill="#8b5cf6" />
              <circle cx="110" cy="190" r="3.5" fill="#ec4899" />
              <circle cx="190" cy="190" r="3.5" fill="#38bdf8" />
            </svg>

            {/* Solid Luminous White CTA Pill: ✨ Create Task */}
            <button
              type="button"
              onClick={handleCreateTask}
              className="relative px-6 py-3 rounded-2xl bg-white text-zinc-950 font-bold text-xs sm:text-sm shadow-[0_0_35px_rgba(255,255,255,0.65)] hover:shadow-[0_0_55px_rgba(255,255,255,0.95)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer z-10 group/btn"
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
            <h3 className="text-xl font-bold text-white">AI Task Creation.</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              Action items automatically created, assigned, and linked.
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            CARD 3: AI CatchUp (Resonant Frequency Waves & Catch Me Up Pill)
           ------------------------------------------------------------------- */}
        <div className="p-7 rounded-3xl bg-gradient-to-b from-[#12101e]/98 to-[#090812]/99 border border-white/[0.09] shadow-2xl hover:border-purple-500/60 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
          {/* Ambient Corner Aura */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/30 transition-all" />

          {/* Top Visual Stage with Audio Resonance Waves */}
          <div className="relative h-64 w-full flex flex-col items-center justify-center select-none">
            {/* Top Frequency Resonance Line */}
            <div className="w-28 h-0.5 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent mb-4" />

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
            <div className="w-36 h-0.5 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent mt-4" />

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
          <div className="pt-4 space-y-2">
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
