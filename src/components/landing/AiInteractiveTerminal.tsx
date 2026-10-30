'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Terminal, ArrowRight, CheckCircle2, Zap, Brain, Layers, Clock, ShieldCheck, Flame } from 'lucide-react';

interface PromptPreset {
  title: string;
  prompt: string;
  icon: any;
  result: {
    title: string;
    velocity: string;
    confidence: string;
    tasks: { name: string; tag: string; time: string }[];
  };
}

const presets: PromptPreset[] = [
  {
    title: 'Sprint Breakdown',
    prompt: 'AI, convert roadmap goals into 14-day sprint tasks with skill-based employee allocation',
    icon: Flame,
    result: {
      title: 'Automated 14-Day Sprint Roadmap',
      velocity: '+38% Faster Kickoff',
      confidence: '99.4%',
      tasks: [
        { name: 'Wireframe responsive SaaS dashboard UI', tag: 'Design', time: '4h' },
        { name: 'Implement Stripe Checkout & Webhook listener', tag: 'Backend', time: '6h' },
        { name: 'Setup PostgreSQL connection pooler (port 6543)', tag: 'DevOps', time: '2h' },
      ],
    },
  },
  {
    title: 'Smart Task Description',
    prompt: 'AI, enrich task #412 with acceptance criteria, edge-case testing and checklist',
    icon: Brain,
    result: {
      title: 'Enriched Deliverable Specification',
      velocity: '0 Re-work required',
      confidence: '98.9%',
      tasks: [
        { name: 'Generate Cypress E2E auth test matrices', tag: 'QA', time: '3h' },
        { name: 'Verify mobile viewport breakpoint flex rules', tag: 'Frontend', time: '2h' },
        { name: 'Audit JWT cookie expiration & rotation keys', tag: 'Security', time: '1.5h' },
      ],
    },
  },
  {
    title: 'Workload Rebalance',
    prompt: 'AI, inspect team capacity and redistribute tasks due in under 24 hours',
    icon: Zap,
    result: {
      title: 'Real-time Workload Optimization',
      velocity: '100% On-Time Delivery',
      confidence: '99.8%',
      tasks: [
        { name: 'Re-assign Landing V2 illustrations to Designer #2', tag: 'Delegated', time: 'Saved 3h' },
        { name: 'Parallelize API migration across 2 workers', tag: 'Balanced', time: 'Saved 5h' },
      ],
    },
  },
];

export default function AiInteractiveTerminal() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  const activePreset = presets[selectedPresetIndex];

  // Dynamic typing animation effect
  useEffect(() => {
    let currentIdx = 0;
    const fullText = activePreset.prompt;
    setDisplayedText('');
    setIsSynthesizing(true);

    const typingInterval = setInterval(() => {
      if (currentIdx <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIdx));
        currentIdx++;
      } else {
        clearInterval(typingInterval);
        setIsSynthesizing(false);
      }
    }, 20);

    return () => clearInterval(typingInterval);
  }, [selectedPresetIndex]);

  return (
    <div className="w-full max-w-4xl mx-auto my-10 relative">
      {/* Ambient background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

      {/* Main Terminal Box */}
      <div className="rounded-3xl border border-indigo-200/90 dark:border-indigo-500/30 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Terminal Title Bar */}
        <div className="px-5 py-3.5 bg-slate-100/90 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-4 w-[1px] bg-slate-300 dark:bg-zinc-700 mx-1" />
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 dark:text-zinc-300 font-bold">
              <Terminal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Adsetsproflow AI Copilot • Live Interactive Demo</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Claude 3.5 &amp; GPT-4o Ready
            </span>
          </div>
        </div>

        {/* Interactive Preset Chips */}
        <div className="px-5 pt-4 pb-2 flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mr-1 uppercase tracking-wider">
            Try AI Mode:
          </span>
          {presets.map((preset, idx) => {
            const Icon = preset.icon;
            const isSelected = selectedPresetIndex === idx;
            return (
              <button
                key={preset.title}
                type="button"
                onClick={() => setSelectedPresetIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer transform active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-500'}`} />
                <span>{preset.title}</span>
              </button>
            );
          })}
        </div>

        {/* Live Prompt Synthesizer Area */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Prompt input simulation box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 font-mono text-xs sm:text-sm text-slate-800 dark:text-zinc-200 flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              &gt;_
            </div>
            <div className="flex-1">
              <span>{displayedText}</span>
              <span className="inline-block w-2 h-4 bg-indigo-500 ml-1 animate-pulse align-middle" />
            </div>
            {isSynthesizing && (
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-500 text-[10px] font-bold flex items-center gap-1 shrink-0 animate-pulse">
                <Sparkles className="w-3 h-3" />
                Thinking...
              </span>
            )}
          </div>

          {/* AI Result Cards with Futuristic Elevation */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-cyan-50/50 dark:from-zinc-900/90 dark:via-zinc-950/90 dark:to-[#070b14] border border-indigo-200/80 dark:border-zinc-800 p-4 sm:p-5 space-y-4">
            {/* Result Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {activePreset.result.title}
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    AI Execution Confidence: <strong className="text-emerald-500">{activePreset.result.confidence}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{activePreset.result.velocity}</span>
                </span>
              </div>
            </div>

            {/* Generated Deliverables List */}
            <div className="space-y-2">
              {activePreset.result.tasks.map((task, idx) => (
                <div
                  key={task.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/90 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/90 hover:border-indigo-400 dark:hover:border-indigo-500/80 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                      0{idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200">
                      {task.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono font-bold text-slate-600 dark:text-zinc-400">
                      {task.tag}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {task.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
