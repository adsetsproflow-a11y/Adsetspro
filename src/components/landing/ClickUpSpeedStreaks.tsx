'use client';

import React from 'react';

export default function ClickUpSpeedStreaks() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -inset-x-12 sm:-inset-x-24 md:-inset-x-44 lg:-inset-x-64 pointer-events-none overflow-visible select-none -z-10"
    >
      {/* =====================================================================
          1. WIDE AMBIENT COSMIC NEON BACKDROPS (BREATHING GLOWS)
         ===================================================================== */}
      {/* Left Ambient Aura */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[350px] sm:w-[500px] h-[300px] sm:h-[420px] bg-gradient-to-r from-indigo-600/35 via-purple-600/20 to-transparent rounded-full blur-[70px] sm:blur-[90px] animate-cosmic-aura" />

      {/* Right Ambient Aura */}
      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[350px] sm:w-[500px] h-[300px] sm:h-[420px] bg-gradient-to-l from-pink-600/35 via-purple-600/20 to-transparent rounded-full blur-[70px] sm:blur-[90px] animate-cosmic-aura" style={{ animationDelay: '2s' }} />

      {/* Top Center Radiant Crown Glow */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[400px] sm:w-[700px] h-[140px] bg-gradient-to-b from-fuchsia-500/25 via-indigo-500/15 to-transparent rounded-full blur-[55px]" />

      {/* =====================================================================
          2. LEFT WING: HORIZONTAL SPEED STREAKS & LASER TRAILS
         ===================================================================== */}
      <div className="absolute inset-y-0 left-0 w-1/2 overflow-visible">
        {/* Streak L1: Neon Violet / Magenta (Top 14%) */}
        <div
          className="absolute top-[14%] right-[92%] h-[2px] w-48 sm:w-72 md:w-96 rounded-full bg-gradient-to-l from-purple-400 via-pink-500 to-transparent shadow-[0_0_16px_#ec4899] animate-streak-left-fast"
        >
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-pink-200 shadow-[0_0_8px_#ec4899]" />
        </div>

        {/* Streak L2: Cyan / Electric Blue Laser (Top 26%) */}
        <div
          className="absolute top-[26%] right-[88%] h-[2.5px] w-60 sm:w-88 md:w-[440px] rounded-full bg-gradient-to-l from-cyan-300 via-sky-500 to-transparent shadow-[0_0_18px_#06b6d4] animate-streak-left-slow"
        >
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-100 shadow-[0_0_12px_#38bdf8]" />
        </div>

        {/* Streak L3: Ultra-Intense Fuchsia / Purple Beam (Top 38%) */}
        <div
          className="absolute top-[38%] right-[94%] h-[3px] w-72 sm:w-96 md:w-[500px] rounded-full bg-gradient-to-l from-fuchsia-400 via-purple-600 to-transparent shadow-[0_0_24px_#d946ef] animate-streak-left-fast"
          style={{ animationDelay: '0.4s' }}
        >
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-fuchsia-200 shadow-[0_0_14px_#f43f5e]" />
        </div>

        {/* Streak L4: Fine Electric Sky Needle (Top 52%) */}
        <div
          className="absolute top-[52%] right-[90%] h-[1.5px] w-52 sm:w-80 md:w-96 rounded-full bg-gradient-to-l from-sky-400 via-indigo-500 to-transparent shadow-[0_0_14px_#38bdf8] animate-streak-left-slow"
          style={{ animationDelay: '1.2s' }}
        />

        {/* Streak L5: Warm Amber / Rose Streak (Top 66%) */}
        <div
          className="absolute top-[66%] right-[93%] h-[2.5px] w-64 sm:w-84 md:w-[420px] rounded-full bg-gradient-to-l from-rose-400 via-amber-500 to-transparent shadow-[0_0_18px_#f43f5e] animate-streak-left-fast"
          style={{ animationDelay: '0.8s' }}
        >
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-100 shadow-[0_0_10px_#f59e0b]" />
        </div>

        {/* Streak L6: Deep Indigo Cosmic Ray (Top 80%) */}
        <div
          className="absolute top-[80%] right-[89%] h-[2px] w-44 sm:w-64 md:w-80 rounded-full bg-gradient-to-l from-indigo-400 via-purple-600 to-transparent shadow-[0_0_14px_#818cf8] animate-streak-left-slow"
          style={{ animationDelay: '1.5s' }}
        />

        {/* Floating Space Warp Particle 1 */}
        <div
          className="absolute top-[32%] right-[85%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#ffffff] animate-particle-left"
        />
        {/* Floating Space Warp Particle 2 */}
        <div
          className="absolute top-[60%] right-[87%] w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#38bdf8] animate-particle-left"
          style={{ animationDelay: '1.4s' }}
        />
      </div>

      {/* =====================================================================
          3. RIGHT WING: HORIZONTAL SPEED STREAKS & LASER TRAILS
         ===================================================================== */}
      <div className="absolute inset-y-0 right-0 w-1/2 overflow-visible">
        {/* Streak R1: Cyan / Emerald Beam (Top 16%) */}
        <div
          className="absolute top-[16%] left-[91%] h-[2px] w-52 sm:w-76 md:w-96 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-transparent shadow-[0_0_16px_#10b981] animate-streak-right-fast"
        >
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-100 shadow-[0_0_8px_#10b981]" />
        </div>

        {/* Streak R2: Neon Pink / Magenta Streak (Top 30%) */}
        <div
          className="absolute top-[30%] left-[88%] h-[2.5px] w-64 sm:w-96 md:w-[460px] rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-600 to-transparent shadow-[0_0_20px_#ec4899] animate-streak-right-slow"
          style={{ animationDelay: '0.3s' }}
        >
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-pink-100 shadow-[0_0_12px_#ec4899]" />
        </div>

        {/* Streak R3: Radiant Violet / Purple Laser (Top 44%) */}
        <div
          className="absolute top-[44%] left-[93%] h-[3px] w-72 sm:w-96 md:w-[500px] rounded-full bg-gradient-to-r from-purple-400 via-indigo-600 to-transparent shadow-[0_0_24px_#a855f7] animate-streak-right-fast"
          style={{ animationDelay: '0.7s' }}
        >
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-purple-100 shadow-[0_0_14px_#a855f7]" />
        </div>

        {/* Streak R4: Electric Sky Laser (Top 58%) */}
        <div
          className="absolute top-[58%] left-[89%] h-[1.5px] w-48 sm:w-72 md:w-[380px] rounded-full bg-gradient-to-r from-sky-400 via-cyan-500 to-transparent shadow-[0_0_14px_#0ea5e9] animate-streak-right-slow"
          style={{ animationDelay: '1.1s' }}
        />

        {/* Streak R5: Warm Amber / Rose Streak (Top 72%) */}
        <div
          className="absolute top-[72%] left-[92%] h-[2.5px] w-60 sm:w-84 md:w-[420px] rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-transparent shadow-[0_0_18px_#f59e0b] animate-streak-right-fast"
          style={{ animationDelay: '0.5s' }}
        >
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-100 shadow-[0_0_10px_#f59e0b]" />
        </div>

        {/* Streak R6: Indigo / Violet Flow (Top 85%) */}
        <div
          className="absolute top-[85%] left-[90%] h-[2px] w-44 sm:w-64 md:w-80 rounded-full bg-gradient-to-r from-indigo-500 via-purple-600 to-transparent shadow-[0_0_14px_#6366f1] animate-streak-right-slow"
          style={{ animationDelay: '1.6s' }}
        />

        {/* Floating Space Warp Particle 1 */}
        <div
          className="absolute top-[36%] left-[86%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#ffffff] animate-particle-right"
        />
        {/* Floating Space Warp Particle 2 */}
        <div
          className="absolute top-[64%] left-[88%] w-1.5 h-1.5 rounded-full bg-pink-300 shadow-[0_0_10px_#ec4899] animate-particle-right"
          style={{ animationDelay: '1.3s' }}
        />
      </div>
    </div>
  );
}
