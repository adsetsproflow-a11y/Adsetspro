'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Flame,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  Clock,
  BarChart3,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Code2,
  Palette,
  FlaskConical,
  PenTool,
  Shield,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { saasStore } from '@/lib/storage';
import { UserProfile, PointsHistory, Task, TaskPriority } from '@/lib/types';

export const Leaderboard: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'priority_graphs'>('priority_graphs');
  const [filterDept, setFilterDept] = useState<'All' | 'Design' | 'Development' | 'Content' | 'Marketing' | 'QA'>('All');

  useEffect(() => {
    const update = () => {
      setProfiles(saasStore.getCompanyProfiles());
      setTasks(saasStore.getCompanyTasks());
      setPointsHistory(saasStore.getPointsHistory());
    };
    update();
    const unsub = saasStore.subscribe(update);
    return unsub;
  }, []);

  const filteredProfiles = profiles
    .filter((p) => filterDept === 'All' || p.department === filterDept)
    .sort((a, b) => b.total_xp - a.total_xp);

  const top1 = filteredProfiles[0];
  const top2 = filteredProfiles[1];
  const top3 = filteredProfiles[2];
  const remaining = filteredProfiles.slice(3);

  // Priority calculations
  const totalTasks = tasks.length || 1;
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent');
  const highTasks = tasks.filter((t) => t.priority === 'high');
  const mediumTasks = tasks.filter((t) => t.priority === 'medium');
  const lowTasks = tasks.filter((t) => t.priority === 'low');

  const urgentCompleted = urgentTasks.filter((t) => t.status === 'completed').length;
  const highCompleted = highTasks.filter((t) => t.status === 'completed').length;
  const mediumCompleted = mediumTasks.filter((t) => t.status === 'completed').length;
  const lowCompleted = lowTasks.filter((t) => t.status === 'completed').length;

  const urgentPct = Math.round((urgentTasks.length / totalTasks) * 100);
  const highPct = Math.round((highTasks.length / totalTasks) * 100);
  const mediumPct = Math.round((mediumTasks.length / totalTasks) * 100);
  const lowPct = Math.round((lowTasks.length / totalTasks) * 100);

  // Designation metrics
  const designationStats = [
    {
      name: 'Developers',
      icon: Code2,
      role: 'Developer',
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      members: profiles.filter((p) => p.designation === 'Developer'),
      tasks: tasks.filter((t) => t.department === 'Development'),
    },
    {
      name: 'Designers',
      icon: Palette,
      role: 'Designer',
      color: 'from-purple-500 to-pink-600',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      members: profiles.filter((p) => p.designation === 'Designer'),
      tasks: tasks.filter((t) => t.department === 'Design'),
    },
    {
      name: 'Digital Marketers',
      icon: TrendingUp,
      role: 'Digital Marketer',
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      members: profiles.filter((p) => p.designation === 'Digital Marketer'),
      tasks: tasks.filter((t) => t.department === 'Marketing'),
    },
    {
      name: 'QA Testers',
      icon: FlaskConical,
      role: 'Tester',
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      members: profiles.filter((p) => p.designation === 'Tester'),
      tasks: tasks.filter((t) => t.department === 'QA'),
    },
    {
      name: 'Content Writers',
      icon: PenTool,
      role: 'Content Writer',
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      members: profiles.filter((p) => p.designation === 'Content Writer'),
      tasks: tasks.filter((t) => t.department === 'Content'),
    },
  ];

  const getReasonBadge = (reason: PointsHistory['reason']) => {
    switch (reason) {
      case 'task_completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Task Completed</span>;
      case 'early_bonus':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">Early Finish Bonus</span>;
      case 'streak_bonus':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">Streak Multiplier</span>;
      case 'overdue_penalty':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">Overdue Penalty</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with View Toggle (Graphs vs Podium) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Leaderboard & Priority Analytics</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Sprint Telemetry
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Interactive High vs Low Priority task graphs, department productivity curves, and gamified XP rankings.
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('priority_graphs')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'priority_graphs'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Priority Graphs & Stats</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Gamified Podium</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PRIORITY GRAPHS & ANALYTICS VIEW */}
      {activeTab === 'priority_graphs' && (
        <div className="space-y-6">
          {/* Main Priority Distribution Graph Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Urgent Priority Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Urgent Priority
                </span>
                <span className="text-xs font-mono font-bold text-zinc-400">{urgentPct}%</span>
              </div>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                {urgentTasks.length} <span className="text-xs font-medium text-zinc-400">tasks</span>
              </div>
              {/* Progress Bar Graph */}
              <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(urgentPct, 6)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                <span>Completed: {urgentCompleted}</span>
                <span>Pending: {urgentTasks.length - urgentCompleted}</span>
              </div>
            </div>

            {/* High Priority Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  High Priority
                </span>
                <span className="text-xs font-mono font-bold text-zinc-400">{highPct}%</span>
              </div>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                {highTasks.length} <span className="text-xs font-medium text-zinc-400">tasks</span>
              </div>
              {/* Progress Bar Graph */}
              <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(highPct, 6)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                <span>Completed: {highCompleted}</span>
                <span>Pending: {highTasks.length - highCompleted}</span>
              </div>
            </div>

            {/* Medium Priority Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Medium Priority
                </span>
                <span className="text-xs font-mono font-bold text-zinc-400">{mediumPct}%</span>
              </div>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                {mediumTasks.length} <span className="text-xs font-medium text-zinc-400">tasks</span>
              </div>
              {/* Progress Bar Graph */}
              <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(mediumPct, 6)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                <span>Completed: {mediumCompleted}</span>
                <span>Pending: {mediumTasks.length - mediumCompleted}</span>
              </div>
            </div>

            {/* Low Priority Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Low Priority
                </span>
                <span className="text-xs font-mono font-bold text-zinc-400">{lowPct}%</span>
              </div>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                {lowTasks.length} <span className="text-xs font-medium text-zinc-400">tasks</span>
              </div>
              {/* Progress Bar Graph */}
              <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(lowPct, 6)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                <span>Completed: {lowCompleted}</span>
                <span>Pending: {lowTasks.length - lowCompleted}</span>
              </div>
            </div>
          </div>

          {/* Interactive Visual Graph: High vs Low Priority Comparative Matrix */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  <span>High Priority vs Low Priority Visual Matrix</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Sprint workload distribution comparing critical deliverable bandwidth against routine tasks.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-red-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Urgent ({urgentTasks.length})
                </span>
                <span className="flex items-center gap-1.5 text-amber-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> High ({highTasks.length})
                </span>
                <span className="flex items-center gap-1.5 text-blue-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Medium ({mediumTasks.length})
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Low ({lowTasks.length})
                </span>
              </div>
            </div>

            {/* Stacked Multi-Segment Graph Bar */}
            <div className="space-y-2">
              <div className="w-full h-8 bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden flex shadow-inner">
                {urgentTasks.length > 0 && (
                  <div
                    style={{ width: `${urgentPct}%` }}
                    className="h-full bg-red-500 hover:opacity-90 transition-all flex items-center justify-center text-white text-[11px] font-black"
                    title={`Urgent: ${urgentTasks.length} tasks (${urgentPct}%)`}
                  >
                    {urgentPct > 10 ? `${urgentPct}%` : ''}
                  </div>
                )}
                {highTasks.length > 0 && (
                  <div
                    style={{ width: `${highPct}%` }}
                    className="h-full bg-amber-500 hover:opacity-90 transition-all flex items-center justify-center text-zinc-950 text-[11px] font-black"
                    title={`High: ${highTasks.length} tasks (${highPct}%)`}
                  >
                    {highPct > 10 ? `${highPct}%` : ''}
                  </div>
                )}
                {mediumTasks.length > 0 && (
                  <div
                    style={{ width: `${mediumPct}%` }}
                    className="h-full bg-blue-500 hover:opacity-90 transition-all flex items-center justify-center text-white text-[11px] font-black"
                    title={`Medium: ${mediumTasks.length} tasks (${mediumPct}%)`}
                  >
                    {mediumPct > 10 ? `${mediumPct}%` : ''}
                  </div>
                )}
                {lowTasks.length > 0 && (
                  <div
                    style={{ width: `${lowPct}%` }}
                    className="h-full bg-emerald-500 hover:opacity-90 transition-all flex items-center justify-center text-white text-[11px] font-black"
                    title={`Low: ${lowTasks.length} tasks (${lowPct}%)`}
                  >
                    {lowPct > 10 ? `${lowPct}%` : ''}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono px-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100% Total Sprint Tasks</span>
              </div>
            </div>

            {/* Side-by-side Comparative Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between text-xs font-extrabold text-red-600 dark:text-red-400">
                  <span>Critical Stream (Urgent + High Priority)</span>
                  <span>{urgentTasks.length + highTasks.length} Tasks</span>
                </div>
                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex justify-between text-[11px]">
                    <span>Completion Rate:</span>
                    <span className="font-bold text-emerald-500">
                      {Math.round(((urgentCompleted + highCompleted) / (urgentTasks.length + highTasks.length || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.round(((urgentCompleted + highCompleted) / (urgentTasks.length + highTasks.length || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between text-xs font-extrabold text-blue-600 dark:text-blue-400">
                  <span>Routine Stream (Medium + Low Priority)</span>
                  <span>{mediumTasks.length + lowTasks.length} Tasks</span>
                </div>
                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex justify-between text-[11px]">
                    <span>Completion Rate:</span>
                    <span className="font-bold text-emerald-500">
                      {Math.round(((mediumCompleted + lowCompleted) / (mediumTasks.length + lowTasks.length || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.round(((mediumCompleted + lowCompleted) / (mediumTasks.length + lowTasks.length || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Department & Designation Productivity Graph Bars */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-500" />
                <span>Designation Workload & Velocity (Developer, Designer, Tester, Marketer, Writer)</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Comparative output and deliverable capacity per specialized company role.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              {designationStats.map((item) => {
                const Icon = item.icon;
                const totalRoleXp = item.members.reduce((acc, m) => acc + m.total_xp, 0);
                const roleTaskCount = item.tasks.length;
                const roleCompleted = item.tasks.filter((t) => t.status === 'completed').length;
                const pct = Math.min(100, Math.round((roleCompleted / (roleTaskCount || 1)) * 100));

                return (
                  <div
                    key={item.name}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl ${item.bgColor} flex items-center justify-center ${item.textColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {item.name} ({item.members.length} members)
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {roleTaskCount} tasks assigned • {totalRoleXp.toLocaleString()} total XP
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {pct}% Velocity
                        </span>
                        <div className="text-[10px] text-zinc-400">
                          {roleCompleted}/{roleTaskCount} Done
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PODIUM & INDIVIDUAL XP RANKING VIEW */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Department Filter Pills */}
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 shrink-0">
              Filter by Role:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {(['All', 'Design', 'Development', 'Content', 'Marketing', 'QA'] as const).map((dept) => (
                <button
                  key={dept}
                  onClick={() => setFilterDept(dept)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterDept === dept
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  {dept === 'All'
                    ? 'All Roles'
                    : dept === 'Design'
                    ? '🎨 Designers'
                    : dept === 'Development'
                    ? '💻 Developers'
                    : dept === 'Marketing'
                    ? '📈 Marketers'
                    : dept === 'QA'
                    ? '🧪 Testers'
                    : '✍️ Writers'}
                </button>
              ))}
            </div>
          </div>

          {/* Top 3 Podium Rendering */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-6">
            {/* 2nd Place (Silver) */}
            {top2 && (
              <div className="order-2 md:order-1 bg-gradient-to-b from-zinc-100 to-zinc-200 dark:from-zinc-800/80 dark:to-zinc-900 rounded-3xl p-5 border border-zinc-300 dark:border-zinc-700 text-center shadow-md relative">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-zinc-800 flex items-center justify-center text-slate-800 dark:text-white font-extrabold text-lg shadow">
                  🥈
                </div>
                <img
                  src={top2.avatar_url}
                  alt={top2.full_name}
                  className="w-16 h-16 rounded-full mx-auto mt-3 object-cover ring-4 ring-slate-300 dark:ring-slate-600 shadow"
                />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-2">
                  {top2.full_name}
                </h3>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-semibold">
                  {top2.designation || top2.department}
                </span>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shadow-xs flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    {top2.total_xp} XP
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-current" />
                    {top2.current_streak}d
                  </span>
                </div>
              </div>
            )}

            {/* 1st Place (Gold Podium - Elevated) */}
            {top1 && (
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-zinc-900 rounded-3xl p-6 border-2 border-amber-400 dark:border-amber-500/60 text-center shadow-xl relative -mt-4">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-white dark:border-zinc-800 flex items-center justify-center text-amber-950 font-black text-xl shadow-lg">
                  🥇
                </div>
                <div className="relative inline-block mt-2">
                  <img
                    src={top1.avatar_url}
                    alt={top1.full_name}
                    className="w-20 h-20 rounded-full mx-auto object-cover ring-4 ring-amber-400 shadow-lg"
                  />
                  <span className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-amber-950 rounded-full">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100 mt-2">
                  {top1.full_name}
                </h3>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block">
                  👑 {top1.designation || top1.department} Sprint Champion
                </span>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-amber-500 text-amber-950 text-xs font-black shadow-md flex items-center gap-1">
                    <Zap className="w-4 h-4 fill-current" />
                    {top1.total_xp} Total XP
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                    {top1.current_streak}d Streak
                  </span>
                </div>
              </div>
            )}

            {/* 3rd Place (Bronze) */}
            {top3 && (
              <div className="order-3 bg-gradient-to-b from-amber-50/50 to-orange-100/50 dark:from-zinc-800/80 dark:to-zinc-900 rounded-3xl p-5 border border-amber-200 dark:border-zinc-700 text-center shadow-md relative">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-amber-700 border-2 border-white dark:border-zinc-800 flex items-center justify-center text-white font-extrabold text-lg shadow">
                  🥉
                </div>
                <img
                  src={top3.avatar_url}
                  alt={top3.full_name}
                  className="w-16 h-16 rounded-full mx-auto mt-3 object-cover ring-4 ring-amber-700/60 shadow"
                />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-2">
                  {top3.full_name}
                </h3>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-semibold">
                  {top3.designation || top3.department}
                </span>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shadow-xs flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    {top3.total_xp} XP
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-current" />
                    {top3.current_streak}d
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Roster Rankings Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-500" />
                <span>Full Sprint Leaderboard</span>
              </h3>
              <span className="text-xs text-zinc-400">
                {filteredProfiles.length} Members Ranked
              </span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredProfiles.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 text-center font-black text-sm text-zinc-400">
                      #{idx + 1}
                    </div>
                    <img
                      src={p.avatar_url}
                      alt={p.full_name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20"
                    />
                    <div>
                      <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span>{p.full_name}</span>
                        {p.employee_id && (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">
                            {p.employee_id}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {p.designation || p.department} • {p.role.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{p.current_streak}d</span>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>{p.total_xp} XP</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Points History Feed */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Recent XP Points Audit Feed</span>
            </h3>
            <div className="space-y-2">
              {pointsHistory.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {getReasonBadge(item.reason)}
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {item.user_name}
                    </span>
                    {item.task_title && (
                      <span className="text-zinc-400 truncate max-w-xs hidden sm:inline">
                        — {item.task_title}
                      </span>
                    )}
                  </div>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    +{item.points_awarded} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
