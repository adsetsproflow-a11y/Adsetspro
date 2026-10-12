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
} from 'lucide-react';
import { saasStore } from '@/lib/storage';
import { UserProfile, PointsHistory } from '@/lib/types';

export const Leaderboard: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [filterDept, setFilterDept] = useState<'All' | 'Design' | 'Development' | 'Content'>('All');

  useEffect(() => {
    const update = () => {
      setProfiles(saasStore.getCompanyProfiles());
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
      {/* Header and Department Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Sprint Gamified Leaderboard
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Earn XP points by completing deliverables on-time and maintaining daily streaks.
            </p>
          </div>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          {(['All', 'Design', 'Development', 'Content'] as const).map((dept) => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterDept === dept
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {dept === 'All' ? 'All Roles' : dept === 'Design' ? '🎨 Designers' : dept === 'Development' ? '💻 Developers' : '✍️ Writers'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Rendering */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-6">
        {/* 2nd Place (Silver) */}
        {top2 && (
          <div className="order-2 md:order-1 bg-gradient-to-b from-zinc-100 to-zinc-200 dark:from-zinc-800/80 dark:to-zinc-900 rounded-2xl p-5 border border-zinc-300 dark:border-zinc-700 text-center shadow-md relative">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-zinc-800 flex items-center justify-center text-slate-800 dark:text-white font-extrabold text-lg shadow">
              🥈 2nd
            </div>
            <img
              src={top2.avatar_url}
              alt={top2.full_name}
              className="w-16 h-16 rounded-full mx-auto mt-3 object-cover ring-4 ring-slate-300 dark:ring-slate-600 shadow"
            />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-2">
              {top2.full_name}
            </h3>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">
              {top2.department}
            </span>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shadow-sm flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                {top2.total_xp} XP
              </span>
              <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                {top2.current_streak}d
              </span>
            </div>
            <div className="h-16 mt-4 bg-slate-200/60 dark:bg-slate-700/40 rounded-xl flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
              Silver Tier Runner-Up
            </div>
          </div>
        )}

        {/* 1st Place (Gold Podium - Elevated) */}
        {top1 && (
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-zinc-900 rounded-2xl p-6 border-2 border-amber-400 dark:border-amber-500/60 text-center shadow-xl relative -mt-4">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-white dark:border-zinc-800 flex items-center justify-center text-amber-950 font-black text-xl shadow-lg animate-bounce">
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
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 mt-2">
              {top1.full_name}
            </h3>
            <span className="text-xs text-amber-700 dark:text-amber-400 block font-semibold">
              👑 {top1.department} Champion
            </span>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-400 text-amber-950 text-xs font-black shadow flex items-center gap-1">
                <Zap className="w-4 h-4 fill-current" />
                {top1.total_xp} XP
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-black flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                {top1.current_streak} Days Streak!
              </span>
            </div>
            <div className="h-24 mt-4 bg-amber-200/50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-xs font-black text-amber-800 dark:text-amber-200 uppercase tracking-wider">
              🏆 Gold Podium Champion
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze) */}
        {top3 && (
          <div className="order-3 bg-gradient-to-b from-orange-50 to-zinc-100 dark:from-orange-950/30 dark:to-zinc-900 rounded-2xl p-5 border border-amber-700/30 text-center shadow-md relative">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-amber-700 border-2 border-white dark:border-zinc-800 flex items-center justify-center text-white font-extrabold text-lg shadow">
              🥉 3rd
            </div>
            <img
              src={top3.avatar_url}
              alt={top3.full_name}
              className="w-16 h-16 rounded-full mx-auto mt-3 object-cover ring-4 ring-amber-700/60 shadow"
            />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-2">
              {top3.full_name}
            </h3>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">
              {top3.department}
            </span>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shadow-sm flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                {top3.total_xp} XP
              </span>
              <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                {top3.current_streak}d
              </span>
            </div>
            <div className="h-12 mt-4 bg-amber-100/40 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-xs font-bold text-amber-800 dark:text-amber-300">
              Bronze Tier Podium
            </div>
          </div>
        )}
      </div>

      {/* Remaining Rankings Table */}
      {remaining.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 font-bold text-xs uppercase tracking-wider text-zinc-500">
            Contenders & Department Rankings
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {remaining.map((user, idx) => (
              <div
                key={user.id}
                className="p-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-bold text-zinc-400">
                    #{idx + 4}
                  </span>
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-300 dark:ring-zinc-700"
                  />
                  <div>
                    <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                      {user.full_name}
                    </h4>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {user.role.replace('_', ' ')} • {user.department}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    {user.current_streak}d
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {user.total_xp} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points History Audit Trail */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-500" />
            Live Points Audit History
          </h3>
          <span className="text-[11px] text-zinc-400">Automated XP ledger</span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-56 overflow-y-auto">
          {pointsHistory.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {item.user_name}
                </span>
                {getReasonBadge(item.reason)}
                {item.task_title && (
                  <span className="text-zinc-400 text-[11px] truncate max-w-xs hidden sm:inline">
                    for &quot;{item.task_title}&quot;
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                +{item.points_awarded} XP
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
