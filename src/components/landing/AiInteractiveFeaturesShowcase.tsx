'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Pause,
  Play,
  Sparkles,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Check,
  Zap,
  Users,
  Send,
  Bot,
  ChevronDown,
  Clock,
  Flame,
  TrendingUp,
} from 'lucide-react';

interface TabItem {
  id: number;
  number: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  activeTextColor: string;
  glowColor: string;
  image: string;
}

const CYCLE_MS = 9000; // time each feature stays on screen

export default function AiInteractiveFeaturesShowcase() {
  const [activeTab, setActiveTab] = useState<number>(0);

  // ---- Auto-play: 1 -> 2 -> 3 -> 4 -> 1 ...
  // Hover pauses; clicking a tab or interacting with the demo stops it;
  // the play/pause button gives manual control. The progress line's CSS
  // animation drives the timing, so pause/resume continues where it left off.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const [focused, setFocused] = useState(false); // typing in the demo pauses, never stops
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const t = window.setTimeout(() => setAutoplay(false), 0);
      return () => window.clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = autoplay && !hovered && !focused && inView;

  // Clicking a tab jumps there and restarts its timer; auto-play then
  // continues clockwise (1 -> 2 -> 3 -> 4 -> 1) from that tab.
  const goTo = (i: number) => {
    setActiveTab(i);
    setCycleKey((k) => k + 1);
  };

  const advance = () => goTo((activeTab + 1) % 4);

  const toggleAutoplay = () => {
    setAutoplay((a) => !a);
    setCycleKey((k) => k + 1); // restart the current tab's timer
  };

  // Tab 0 (AI Assistance) interactive state
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Pro');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [generationOutput, setGenerationOutput] = useState<string[] | null>(null);

  // Tab 1 (Team Chat) state - pure text & interactive message stream
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'Sarah Kim',
      role: 'Design Lead',
      avatar: 'S',
      avatarBg: 'from-pink-500 to-rose-600',
      time: '11:42 AM',
      text: 'Updated the Kanban card states and high-contrast dark theme colors. Ready for review! 🚀',
      badge: 'Design System',
    },
    {
      id: 2,
      sender: 'David Lee',
      role: 'Tech Lead',
      avatar: 'D',
      avatarBg: 'from-cyan-500 to-blue-600',
      time: '11:44 AM',
      text: 'PR #142 reviewed & approved. Tenant schema isolation tests passed cleanly with 0 latency regressions. Merged to staging! ⚡',
      badge: 'Backend • Merged',
    },
    {
      id: 3,
      sender: 'Alex Chen',
      role: 'Product Lead',
      avatar: 'A',
      avatarBg: 'from-purple-500 to-indigo-600',
      time: '11:46 AM',
      text: '@team Sprint velocity is 24% ahead of schedule. Release candidate v2.4 tagged for deployment.',
      badge: 'Sprint Alpha',
    },
  ]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatReactions, setChatReactions] = useState<{ [key: string]: number }>({
    '🚀': 12,
    '🔥': 18,
    '✅': 14,
    '❤️': 9,
  });

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || chatInputText).trim();
    if (!text) return;
    const newMsg = {
      id: Date.now(),
      sender: 'You',
      role: 'Engineering',
      avatar: 'Y',
      avatarBg: 'from-emerald-500 to-teal-600',
      time: 'Just now',
      text,
      badge: 'Live Message',
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInputText('');
  };

  // Tab 3 (Smart Task Management) interactive checklist state
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Finalize OpenAPI 3.1 multi-tenant Swagger specs', done: true },
    { id: 2, text: 'Configure Redis JWT session caching middleware', done: true },
    { id: 3, text: 'Deploy PostgreSQL automated tenant migration hooks', done: true },
    { id: 4, text: 'Run end-to-end stress tests with 10k concurrent sessions', done: false },
  ]);

  const toggleChecklistItem = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleSimulateAiGeneration = () => {
    setIsGenerating(true);
    setGenerationOutput(null);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationOutput([
        'Subtask 1: Tenant schema migration verification (Assigned to Harish K.)',
        'Subtask 2: Real-time SSE alert notification pipeline (Assigned to Suriya P.)',
        'Subtask 3: Automated P95 latency benchmark < 80ms (Assigned to Praveen R.)',
      ]);
    }, 900);
  };

  const handleAddReaction = (emoji: string) => {
    setChatReactions((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
    }));
  };

  const tabs: TabItem[] = [
    {
      id: 0,
      number: '1',
      title: 'AI Assistance',
      subtitle:
        'Get smart suggestions, automate routine work, and complete tasks faster with AI.',
      icon: Sparkles,
      accentColor: '#38bdf8',
      badgeBg: 'bg-cyan-500/10',
      badgeBorder: 'border-cyan-500/30',
      activeTextColor: 'text-cyan-400',
      glowColor: 'rgba(56, 189, 248, 0.4)',
      image: '/images/1_ai_assistance (3).webp',
    },
    {
      id: 1,
      number: '2',
      title: 'Team Chat',
      subtitle:
        'Communicate instantly, share updates, and keep your team connected in one place.',
      icon: MessageSquare,
      accentColor: '#ec4899',
      badgeBg: 'bg-pink-500/10',
      badgeBorder: 'border-pink-500/30',
      activeTextColor: 'text-pink-400',
      glowColor: 'rgba(236, 72, 153, 0.4)',
      image: '/images/2_team_chat (2).webp',
    },
    {
      id: 2,
      number: '3',
      title: 'Smart Analytics',
      subtitle:
        'Track project performance, monitor progress, and make data-driven decisions.',
      icon: BarChart3,
      accentColor: '#a855f7',
      badgeBg: 'bg-purple-500/10',
      badgeBorder: 'border-purple-500/30',
      activeTextColor: 'text-purple-400',
      glowColor: 'rgba(168, 85, 247, 0.4)',
      image: '/images/3_smart_analytics.webp',
    },
    {
      id: 3,
      number: '4',
      title: 'Smart Task Management',
      subtitle:
        'Organize tasks, set priorities, assign responsibilities, and meet deadlines with ease.',
      icon: CheckCircle2,
      accentColor: '#10b981',
      badgeBg: 'bg-emerald-500/10',
      badgeBorder: 'border-emerald-500/30',
      activeTextColor: 'text-emerald-400',
      glowColor: 'rgba(168, 85, 129, 0.4)',
      image: '/images/4_smart_task_management (2).webp',
    },
  ];

  const completedCount = checklist.filter((i) => i.done).length;

  return (
    <div
      ref={rootRef}
      className="fx-showcase w-full relative"
      style={{ '--fx-accent': tabs[activeTab].glowColor } as React.CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Outer Glow Backdrop (tints to the active feature) */}
      <div
        className="absolute -inset-6 rounded-[40px] blur-3xl pointer-events-none opacity-60 transition-[background] duration-700"
        style={{ background: `radial-gradient(60% 60% at 70% 50%, ${tabs[activeTab].glowColor}, transparent 70%)` }}
      />

      {/* Main Container (gradient hairline border) */}
      <div className="fx-frame relative rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 overflow-hidden">
        {/* Subtle grid background inside card */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Ambient Corner Radial Halos */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Split Grid: Left (Tabs) & Right (Interactive Preview Display) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch relative z-10">
          {/* ===================================================================
              LEFT SIDE: VERTICAL INTERACTIVE TAB MENU (Reference images 2-5)
             =================================================================== */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 mb-3">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Feature Exploration</span>
              </span>

              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => goTo(tab.id)}
                    aria-pressed={isActive}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-500 relative group cursor-pointer overflow-hidden ${
                      isActive ? 'fx-tab-active' : 'hover:bg-white/[0.025]'
                    }`}
                    style={{ '--tab-accent': tab.accentColor, '--tab-glow': tab.glowColor } as React.CSSProperties}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
                        style={{
                          backgroundColor: tab.accentColor,
                          boxShadow: `0 0 14px ${tab.accentColor}`,
                        }}
                      />
                    )}

                    {/* Progress line: when it fills, the showcase advances */}
                    {isActive && (
                      <span className="absolute left-4 right-4 bottom-0 h-[3px] rounded-full bg-white/[0.08] overflow-hidden">
                        {autoplay ? (
                          <span
                            key={cycleKey}
                            className="fx-progress block h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${tab.accentColor}, #ffffff)`,
                              boxShadow: `0 0 10px ${tab.accentColor}`,
                              animationDuration: `${CYCLE_MS}ms`,
                              animationPlayState: running ? 'running' : 'paused',
                            }}
                            onAnimationEnd={advance}
                          />
                        ) : (
                          <span className="block h-full w-full rounded-full" style={{ background: tab.accentColor, opacity: 0.6 }} />
                        )}
                      </span>
                    )}

                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 ${
                          isActive
                            ? `${tab.badgeBg} ${tab.badgeBorder} ${tab.activeTextColor} scale-105 shadow-sm`
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3
                            className={`text-base sm:text-lg font-bold tracking-tight transition-colors ${
                              isActive
                                ? 'text-white'
                                : 'text-zinc-400 group-hover:text-zinc-200'
                            }`}
                          >
                            <span
                              className={`mr-2 font-mono text-sm ${
                                isActive ? tab.activeTextColor : 'text-zinc-500'
                              }`}
                            >
                              {tab.number}.
                            </span>
                            {tab.title}
                          </h3>

                          {isActive && (
                            <ArrowRight
                              className={`w-4 h-4 shrink-0 transition-transform ${tab.activeTextColor}`}
                            />
                          )}
                          {/* "Up next" hint so visitors see it will advance by itself */}
                          {autoplay && !isActive && tab.id === (activeTab + 1) % 4 && (
                            <span className="fx-upnext shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 ring-1 ring-white/10 bg-white/[0.04]">
                              <span className="w-1 h-1 rounded-full" style={{ background: tab.accentColor }} />
                              Up next
                            </span>
                          )}
                        </div>

                        {/* Always visible description with smooth highlight when active */}
                        <p
                          className={`text-xs leading-relaxed mt-1.5 transition-colors ${
                            isActive
                              ? 'text-zinc-300'
                              : 'text-zinc-400 group-hover:text-zinc-300'
                          }`}
                        >
                          {tab.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Playback controls */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3 text-xs text-zinc-400 px-1">
              <button
                type="button"
                onClick={toggleAutoplay}
                className="group/play flex items-center gap-2 rounded-full pl-1 pr-3 py-1 ring-1 ring-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:ring-white/20 transition-all cursor-pointer"
                aria-label={autoplay ? 'Pause auto-play' : 'Start auto-play'}
              >
                {/* Play/pause with a countdown ring that fills in sync with the tab */}
                <span className="relative w-7 h-7 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 28 28" aria-hidden>
                    <circle cx="14" cy="14" r="12.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    {autoplay && (
                      <circle
                        key={cycleKey}
                        cx="14"
                        cy="14"
                        r="12.5"
                        fill="none"
                        stroke={tabs[activeTab].accentColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="fx-ring"
                        style={{
                          animationDuration: `${CYCLE_MS}ms`,
                          animationPlayState: running ? 'running' : 'paused',
                        }}
                      />
                    )}
                  </svg>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white transition-colors"
                    style={{ background: tabs[activeTab].accentColor, boxShadow: `0 0 14px ${tabs[activeTab].glowColor}` }}
                  >
                    {autoplay ? <Pause className="w-2.5 h-2.5" fill="currentColor" /> : <Play className="w-2.5 h-2.5 translate-x-[1px]" fill="currentColor" />}
                  </span>
                </span>
                <span className="text-[11px] font-medium text-zinc-300 text-left leading-tight">
                  {!autoplay ? (
                    'Stopped · press play'
                  ) : running ? (
                    <>
                      <span className="block text-[9px] uppercase tracking-wider text-zinc-500">Next up</span>
                      {tabs[(activeTab + 1) % 4].title}
                    </>
                  ) : (
                    (focused ? 'Paused while typing' : 'Paused · resumes on leave')
                  )}
                </span>
              </button>

              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => goTo(t.id)}
                    aria-label={`Show ${t.title}`}
                    className="h-1.5 rounded-full transition-all duration-500 cursor-pointer"
                    style={{
                      width: activeTab === t.id ? 22 : 6,
                      background: activeTab === t.id ? t.accentColor : 'rgba(255,255,255,0.18)',
                    }}
                  />
                ))}
                <span className="ml-2 font-mono text-[11px] text-zinc-500">
                  {String(activeTab + 1).padStart(2, '0')} / 04
                </span>
              </div>
            </div>
          </div>

          {/* ===================================================================
              RIGHT SIDE: DYNAMIC INTERACTIVE DISPLAY CARD (Reference images 2-5)
             =================================================================== */}
          <div
            className="lg:col-span-7 flex flex-col justify-center"
            // Typing/focusing inside the demo pauses auto-play; it resumes on blur
            onFocusCapture={(e) => setFocused(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)}
            onBlurCapture={() => setFocused(false)}
          >
            <div className="fx-panel w-full rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden min-h-[460px] flex flex-col justify-between">
              {/* Subtle Ambient Backing Glow specific to current tab */}
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: tabs[activeTab].accentColor }}
              />

              {/* Dynamic Feature Image Display */}
              <div className="relative w-full flex-1 flex items-center justify-center py-2 overflow-hidden fx-panel-in">
                <img
                  key={tabs[activeTab].id}
                  src={tabs[activeTab].image}
                  alt={tabs[activeTab].title}
                  className="w-full h-auto max-h-[490px] object-contain rounded-xl shadow-2xl transition-all duration-500 hover:scale-[1.01]"
                />
              </div>

              {/* Bottom Card Footer with Direct Workspace CTA */}
              <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400">
                  Real-time preview powered by Adsetspro Flow OS
                </span>
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                  <span>Explore in Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .fx-showcase .fx-frame {
          background: linear-gradient(#090e1a, #090e1a) padding-box,
            linear-gradient(160deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.03) 40%, var(--fx-accent) 100%) border-box;
          border: 1px solid transparent;
          transition: background 0.7s ease;
        }
        .fx-showcase .fx-panel {
          background: radial-gradient(120% 80% at 100% 0%, rgba(255, 255, 255, 0.04), transparent 60%), #0b1120;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.08),
            0 30px 60px -30px var(--fx-accent);
          transition: box-shadow 0.7s ease;
        }
        .fx-showcase .fx-tab-active {
          background: linear-gradient(90deg, color-mix(in srgb, var(--tab-accent) 10%, transparent), rgba(255, 255, 255, 0.03) 60%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 12px 40px -18px var(--tab-glow);
        }
        .fx-showcase .fx-progress {
          transform-origin: left;
          animation-name: fxProgress;
          animation-timing-function: linear;
          animation-fill-mode: both;
        }
        @keyframes fxProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .fx-showcase .fx-ring {
          stroke-dasharray: 78.54; /* 2 * PI * 12.5 */
          animation-name: fxRing;
          animation-timing-function: linear;
          animation-fill-mode: both;
        }
        @keyframes fxRing {
          from { stroke-dashoffset: 78.54; }
          to { stroke-dashoffset: 0; }
        }
        .fx-showcase .fx-upnext {
          animation: fxUpNext 2.4s ease-in-out infinite;
        }
        @keyframes fxUpNext {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        .fx-showcase .fx-panel-in {
          animation: fxPanelIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes fxPanelIn {
          from { opacity: 0; transform: translateY(14px) scale(0.985); filter: blur(6px); }
          to { opacity: 1; transform: none; filter: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fx-showcase .fx-panel-in { animation: none; }
        }
      `}</style>
    </div>
  );
}
