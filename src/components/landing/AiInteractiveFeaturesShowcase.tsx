'use client';

import React, { useState } from 'react';
import {
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
}

export default function AiInteractiveFeaturesShowcase() {
  const [activeTab, setActiveTab] = useState<number>(0);

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
      glowColor: 'rgba(16, 185, 129, 0.4)',
    },
  ];

  const completedCount = checklist.filter((i) => i.done).length;

  return (
    <div className="w-full relative">
      {/* Outer Glow Backdrop */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 rounded-3xl blur-2xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative rounded-3xl bg-[#090e1a]/95 border border-white/[0.08] shadow-2xl p-6 sm:p-8 lg:p-10 overflow-hidden">
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
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-300 relative group cursor-pointer border ${
                      isActive
                        ? 'bg-white/[0.05] border-white/15 shadow-lg shadow-black/40'
                        : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/[0.06]'
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full shadow-md"
                        style={{
                          backgroundColor: tab.accentColor,
                          boxShadow: `0 0 12px ${tab.accentColor}`,
                        }}
                      />
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

            {/* Bottom Sub-Widget (Instant Switch Helper) */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 px-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live interactive demo</span>
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                Tab {activeTab + 1} of 4
              </span>
            </div>
          </div>

          {/* ===================================================================
              RIGHT SIDE: DYNAMIC INTERACTIVE DISPLAY CARD (Reference images 2-5)
             =================================================================== */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="w-full rounded-2xl bg-[#0b1120] border border-white/10 p-5 sm:p-7 shadow-2xl relative overflow-hidden min-h-[460px] flex flex-col justify-between">
              {/* Subtle Ambient Backing Glow specific to current tab */}
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: tabs[activeTab].accentColor }}
              />

              {/* ---------------------------------------------------------------
                  TAB 0 PREVIEW: 1. AI Assistance (Task / Prompt Synthesizer)
                 --------------------------------------------------------------- */}
              {activeTab === 0 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Top Header Bar */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">AI Task Synthesizer</h4>
                        <span className="text-[10px] text-zinc-400">
                          Automated Sprint &amp; Scope Generation
                        </span>
                      </div>
                    </div>

                    {/* Model Dropdown Selector (From Image 2 reference) */}
                    <div className="relative">
                      <button
                        onClick={() => setShowModelMenu(!showModelMenu)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-cyan-500/40 text-xs font-mono text-zinc-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{selectedModel}</span>
                        <ChevronDown className="w-3 h-3 text-zinc-400" />
                      </button>

                      {showModelMenu && (
                        <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl py-1 z-30 text-xs">
                          {['Gemini 1.5 Pro', 'ChatGPT-4o', 'Claude 3.5 Sonnet', 'Cohere Command'].map(
                            (model) => (
                              <button
                                key={model}
                                onClick={() => {
                                  setSelectedModel(model);
                                  setShowModelMenu(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 hover:bg-zinc-900 flex items-center justify-between cursor-pointer ${
                                  selectedModel === model
                                    ? 'text-cyan-400 font-bold bg-cyan-500/10'
                                    : 'text-zinc-300'
                                }`}
                              >
                                <span>{model}</span>
                                {selectedModel === model && <Check className="w-3 h-3 text-cyan-400" />}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prompt Box */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      Suggestion for Task Prompt
                    </label>
                    <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/[0.08] text-xs text-zinc-200 font-mono flex items-center justify-between">
                      <span className="truncate pr-2">
                        Generate sprint milestones based on: <span className="text-cyan-400">Q3 Enterprise Launch</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] uppercase font-bold shrink-0">
                        Context Linked
                      </span>
                    </div>
                  </div>

                  {/* AI Generated Deliverables Box */}
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-cyan-500/25 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Synthesized Sprint Scope:</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        ● 100% Verified
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-zinc-300">
                      <div className="flex items-start gap-2 bg-zinc-900/60 p-2 rounded-lg border border-white/[0.04]">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>Build tenant schema isolation &amp; dynamic routing</span>
                      </div>
                      <div className="flex items-start gap-2 bg-zinc-900/60 p-2 rounded-lg border border-white/[0.04]">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>Real-time SSE event pipeline with auto-reconnect</span>
                      </div>
                      <div className="flex items-start gap-2 bg-zinc-900/60 p-2 rounded-lg border border-white/[0.04]">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>Automated SLA latency tests &lt; 90ms benchmark</span>
                      </div>

                      {generationOutput &&
                        generationOutput.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/30 text-cyan-200 animate-in fade-in"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Interactive Action Button */}
                  <button
                    onClick={handleSimulateAiGeneration}
                    disabled={isGenerating}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer transition-all"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>
                      {isGenerating ? 'AI Synthesizing Scope...' : 'Run Live AI Synthesis'}
                    </span>
                  </button>
                </div>
              )}

              {/* ---------------------------------------------------------------
                  TAB 1 PREVIEW: 2. Team Chat (Real-Time Threads & Collaborative Messaging)
                 --------------------------------------------------------------- */}
              {activeTab === 1 && (
                <div className="space-y-3.5 animate-in fade-in duration-300">
                  {/* Channel Header Bar */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center font-bold text-xs">
                        #
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white"># sprint-release-v2</h4>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>4 Team Members Online</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex -space-x-1.5">
                      {['Sarah K.', 'Alex C.', 'David L.', 'Maria R.'].map((name, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 border border-zinc-950 flex items-center justify-center text-[9px] font-bold text-white"
                          title={name}
                        >
                          {name[0]}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Real Message Stream (Pure Text & Live Collaboration - Zero Voice) */}
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3 rounded-xl bg-zinc-950/80 border border-white/[0.06] hover:border-pink-500/20 transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-5 h-5 rounded-full bg-gradient-to-tr ${msg.avatarBg} text-white text-[9px] font-bold flex items-center justify-center`}
                            >
                              {msg.avatar}
                            </div>
                            <span className="text-xs font-bold text-pink-400">
                              {msg.sender}{' '}
                              <span className="text-[10px] text-zinc-400 font-normal">
                                ({msg.role})
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 font-mono">
                              {msg.badge}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {msg.time}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-200 pl-7 leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* AI Copilot Thread Summarizer Pill */}
                  <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-[11px] text-purple-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">
                        AI Summary: All 3 pull requests merged cleanly, zero blockers remaining.
                      </span>
                    </span>
                    <span className="text-emerald-400 font-bold font-mono text-[10px] shrink-0 ml-2">
                      Live Synced
                    </span>
                  </div>

                  {/* Interactive Quick Reply Suggestions */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                    <span className="text-[10px] text-zinc-400 shrink-0 font-mono">Quick:</span>
                    {['Looks good! 👍', 'Approved for prod 🚀', 'Latency verified ⚡'].map(
                      (phrase) => (
                        <button
                          key={phrase}
                          type="button"
                          onClick={() => handleSendMessage(phrase)}
                          className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-pink-500/30 text-[10px] text-zinc-300 hover:text-white shrink-0 cursor-pointer transition-colors"
                        >
                          {phrase}
                        </button>
                      )
                    )}
                  </div>

                  {/* Interactive Live Chat Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2 pt-1 border-t border-white/[0.06]"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        placeholder="Reply in #sprint-release-v2..."
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 hover:border-pink-500/30 focus:border-pink-500 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/30 cursor-pointer transition-all hover:scale-105 active:scale-95"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send</span>
                    </button>
                  </form>

                  {/* Quick Reactions Bar */}
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      {['🚀', '🔥', '✅', '❤️'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleAddReaction(emoji)}
                          className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>{emoji}</span>
                          <span className="font-mono text-[10px] text-zinc-400">
                            {chatReactions[emoji] || 0}
                          </span>
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400">Click to react</span>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------------------
                  TAB 2 PREVIEW: 3. Smart Analytics (Telemetry & Circular KPIs)
                 --------------------------------------------------------------- */}
              {activeTab === 2 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Top Header */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Smart Velocity Analytics</h4>
                        <span className="text-[10px] text-zinc-400">
                          Automated Sprint Insights &amp; KPI Breakdown
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-mono text-purple-300 font-bold">
                      Q3 Sprint 6
                    </span>
                  </div>

                  {/* Circular KPI Metrics (From Image 5 reference) */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Circle 1 */}
                    <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/[0.08] flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-full bg-pink-500/10 border-2 border-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-pink-500/20">
                        <span className="text-xs font-black text-pink-400 font-mono">94.2%</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Delivery Rate</span>
                        <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                          Top 2% among high-growth SaaS teams
                        </span>
                      </div>
                    </div>

                    {/* Circle 2 */}
                    <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/[0.08] flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-full bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
                        <span className="text-xs font-black text-cyan-300 font-mono">+38%</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Velocity Surge</span>
                        <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                          Tasks resolved ahead of deadline
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Velocity Histogram Bars */}
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-semibold">Weekly Sprint Output</span>
                      <span className="text-purple-400 font-mono text-[11px] font-bold">
                        Average: 42 Story Pts/Wk
                      </span>
                    </div>

                    <div className="h-16 flex items-end justify-between gap-2 pt-2 px-1">
                      {[35, 50, 42, 68, 85, 96].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-purple-600/40 to-purple-400 group-hover:to-cyan-400 transition-all duration-300"
                            style={{ height: `${val}%` }}
                          />
                          <span className="text-[9px] font-mono text-zinc-400">
                            Wk {idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Takeaway Insights Bulleted List (From Image 5 reference) */}
                  <div className="space-y-1.5 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span>Zero critical blockers detected across all active departments.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>Release milestone projected 3 days ahead of original schedule.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------------------
                  TAB 3 PREVIEW: 4. Smart Task Management (Interactive Kanban Task)
                 --------------------------------------------------------------- */}
              {activeTab === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Task Header Bar (From Image 3 reference) */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        PRO
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">Task PRO-10</h4>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                            Sprint 6
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          Assigned to Monica Daniel • Donnelly Construction
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      <span>High Priority</span>
                    </span>
                  </div>

                  {/* Task Description Summary */}
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/[0.06] space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      Task Summary
                    </span>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      Luxe villa construction delivers premium, custom-designed homes with elegant architecture, superior materials, and tailored interiors.
                    </p>
                  </div>

                  {/* Interactive Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-semibold">Subtasks Completion</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {completedCount} / {checklist.length} ({Math.round((completedCount / checklist.length) * 100)}%)
                      </span>
                    </div>

                    <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-white/[0.06]">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(completedCount / checklist.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Interactive Checklist (Click to Toggle in Real-Time) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      Interactive Subtask Checklist (Click to toggle):
                    </span>

                    <div className="space-y-1.5">
                      {checklist.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            item.done
                              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                              : 'bg-zinc-950/60 border-white/[0.06] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              item.done
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-zinc-700 bg-zinc-900'
                            }`}
                          >
                            {item.done && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span
                            className={`text-xs ${
                              item.done ? 'line-through text-zinc-400' : 'text-zinc-200'
                            }`}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
    </div>
  );
}
