'use client';

import React, { useState } from 'react';
import { Cpu, Zap, Activity, Radio, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AiHolographicSides() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* =====================================================================
          LEFT SIDE HUD: AI Neural Engine & Frequency Equalizer
         ===================================================================== */}
      <aside
        aria-label="AI System Status HUD"
        className={`hidden xl:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 flex-col items-start transition-all duration-300 ${
          collapsed ? '-translate-x-[calc(100%-20px)]' : 'translate-x-0'
        }`}
      >
        <div className="relative p-3.5 rounded-2xl bg-white/85 dark:bg-[#090d16]/85 border border-indigo-200/80 dark:border-indigo-500/30 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 space-y-3 w-52 group">
          {/* Laser scanning beam line moving down */}
          <div className="animate-laser-scan rounded-full opacity-60" />

          {/* Header & Status Indicator */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              {/* Radar Sweeping Core */}
              <div className="relative w-6 h-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-indigo-500/40 animate-ping opacity-75" />
                <div className="absolute inset-0.5 rounded-full border-t-2 border-indigo-500 animate-radar-sweep" />
                <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 relative z-10" />
              </div>
              <div>
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-800 dark:text-white block leading-none">
                  AI Synapse OS
                </span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Neural Core Online
                </span>
              </div>
            </div>

            {/* Collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand AI HUD' : 'Minimize AI HUD'}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* AI Neural Equalizer Bars (Dynamic Bouncing Audio/Neural Visualizer) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-500" />
                <span>Prompt Frequency</span>
              </span>
              <span className="font-mono text-[9px] text-indigo-600 dark:text-indigo-400 font-bold">
                98.4 kHz
              </span>
            </div>

            <div className="h-7 px-2.5 rounded-xl bg-slate-100/80 dark:bg-zinc-950/70 border border-slate-200/60 dark:border-zinc-800/80 flex items-center justify-between gap-1.5">
              <div className="w-1.5 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full animate-equalizer-1" />
              <div className="w-1.5 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full animate-equalizer-2" />
              <div className="w-1.5 bg-gradient-to-t from-cyan-400 to-indigo-500 rounded-full animate-equalizer-3" />
              <div className="w-1.5 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full animate-equalizer-4" />
              <div className="w-1.5 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-full animate-equalizer-5" />
              <div className="w-1.5 bg-gradient-to-t from-cyan-500 to-emerald-400 rounded-full animate-equalizer-2" />
              <div className="w-1.5 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full animate-equalizer-4" />
            </div>
          </div>

          {/* Live Micro-Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-0.5 text-[10px]">
            <div className="p-1.5 rounded-lg bg-slate-100/70 dark:bg-zinc-950/50 border border-slate-200/60 dark:border-zinc-800/60">
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 block">Latency</span>
              <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">0.08 ms</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-100/70 dark:bg-zinc-950/50 border border-slate-200/60 dark:border-zinc-800/60">
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 block">Tokens/s</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">8.4k</span>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          RIGHT SIDE HUD: Real-time Copilot Orchestrator Pulse
         ===================================================================== */}
      <aside
        aria-label="AI Copilot Live Monitor"
        className="hidden xl:flex fixed right-4 top-1/2 -translate-y-1/2 z-40 flex-col items-end pointer-events-none"
      >
        <div className="p-3.5 rounded-2xl bg-white/85 dark:bg-[#090d16]/85 border border-cyan-200/80 dark:border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 space-y-2.5 w-48 text-right pointer-events-auto group">
          {/* Pulsing Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 pb-2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[9px] font-bold tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} />
              Copilot Live
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
            </div>
          </div>

          {/* AI Automated Pipeline Highlight */}
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium flex items-center justify-between">
              <span className="font-mono text-[9px] text-emerald-500 font-bold">100% Synced</span>
              <span>Sprint #12</span>
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-white">
              Zero Bottlenecks
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
              AI auto-assigned 14 subtasks with smart workload balance.
            </p>
          </div>

          {/* Mini Progress Glow Bar */}
          <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000"
              style={{ width: '84%' }}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
