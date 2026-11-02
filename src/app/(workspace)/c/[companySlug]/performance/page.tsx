'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ListTodo,
  TrendingUp,
  RefreshCw,
  Calendar,
  ExternalLink,
  Target,
  Zap,
  Sparkles,
  ShieldCheck,
  Check,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatDate } from '@/lib/utils/dateFormat';
import { createClient } from '@/lib/supabase/client';
import CenterLoader from '@/components/common/CenterLoader';
import { getCachedData, setCachedData } from '@/lib/cache/clientCache';

interface PerformanceBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: string;
}

interface EmployeePerformanceData {
  employee: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  summary: {
    assigned: number;
    inProgress: number;
    submitted: number;
    revisionRequired: number;
    approved: number;
    overdue: number;
    totalTasks: number;
    completionRate: number;
    onTimeRate: number;
    firstTimeApprovalRate: number;
    avgTurnaroundDays: number;
    qualityScore: number;
    qualityTier: string;
  };
  charts: {
    monthlyCompletionTrend: Array<{
      month: string;
      approved: number;
    }>;
    priorityCounts?: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  badges?: PerformanceBadge[];
  taskHistory: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    task_url?: string | null;
    departmentName: string;
    projectName: string;
    due_date: string | null;
    start_date: string | null;
    created_at: string;
    revisionCycles: number;
    isOverdue: boolean;
  }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-bold text-white">{label}</p>
        <p className="text-emerald-400 font-semibold">
          Approved Deliverables: <span className="font-mono text-white">{payload[0]?.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function WorkspaceMyPerformancePage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const supabase = createClient();

  const [data, setData] = useState<EmployeePerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'approved' | 'in_progress' | 'revisions'>('all');

  const fetchMyPerformance = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User session not authenticated.');
      }

      const res = await fetch(`/api/companies/${companySlug}/analytics/employee/${user.id}`);
      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to fetch personal performance data');
      }

      setData(resData);
      const cacheKey = `my_performance_${companySlug}`;
      setCachedData(cacheKey, resData, 60 * 1000);
    } catch (err: any) {
      setError(err.message || 'Error loading performance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      const cacheKey = `my_performance_${companySlug}`;
      const cached = getCachedData<EmployeePerformanceData>(cacheKey);
      if (cached) {
        setData(cached);
        setIsLoading(false);
        fetchMyPerformance(true);
      } else {
        fetchMyPerformance(false);
      }
    }
  }, [companySlug]);

  if (isLoading && !data) {
    return <CenterLoader message="Analyzing your performance scorecard..." />;
  }

  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 max-w-md mx-auto border border-red-500/20 text-xs">
          {error}
        </div>
        <button
          onClick={() => fetchMyPerformance(false)}
          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredHistory = (data?.taskHistory || []).filter((task) => {
    if (historyFilter === 'approved') return task.status === 'approved';
    if (historyFilter === 'in_progress') return task.status === 'in_progress';
    if (historyFilter === 'revisions') return task.revisionCycles > 0 || task.status === 'revision_required';
    return true;
  });

  const qualityScore = data?.summary?.qualityScore ?? 85;
  const qualityTier = data?.summary?.qualityTier ?? 'Good Standing';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                My Performance Scorecard
              </h1>
              <p className="text-xs text-zinc-400">
                Personal execution metrics, delivery velocity, and live deliverable tracking.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchMyPerformance(false)}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* EXECUTIVE SCORE & QUALITY INDEX BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-zinc-950/80 to-purple-950/30 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Overall Quality Rating */}
          <div className="md:col-span-1 flex items-center gap-4 border-b md:border-b-0 md:border-r border-zinc-800/80 pb-4 md:pb-0 md:pr-4">
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex flex-col items-center justify-center shadow-lg">
                <span className="text-2xl font-black text-white">{qualityScore}</span>
                <span className="text-[10px] uppercase font-bold text-indigo-400">/ 100</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                Quality Index
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-white">{qualityTier}</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Based on accuracy, deadlines, and revisions.
              </p>
            </div>
          </div>

          {/* 3 Core Velocity & Quality Ratios */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>On-Time Delivery</span>
              </div>
              <p className="text-2xl font-black text-emerald-400">
                {data?.summary?.onTimeRate ?? 100}%
              </p>
              <p className="text-[10px] text-zinc-500">Finished on or before deadline</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>First-Pass Approvals</span>
              </div>
              <p className="text-2xl font-black text-indigo-400">
                {data?.summary?.firstTimeApprovalRate ?? 100}%
              </p>
              <p className="text-[10px] text-zinc-500">Approved without rework</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-yellow-400" />
                <span>Avg Turnaround</span>
              </div>
              <p className="text-2xl font-black text-yellow-300">
                {data?.summary?.avgTurnaroundDays && data.summary.avgTurnaroundDays > 0
                  ? `${data.summary.avgTurnaroundDays}d`
                  : '< 1d'}
              </p>
              <p className="text-[10px] text-zinc-500">Assignment to completion</p>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY KPI COUNTERS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Assigned */}
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Assigned
          </span>
          <p className="text-2xl font-black text-blue-400">{data?.summary?.assigned || 0}</p>
          <p className="text-[10px] text-zinc-500">Awaiting start</p>
        </div>

        {/* In Progress */}
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            In Progress
          </span>
          <p className="text-2xl font-black text-indigo-400">{data?.summary?.inProgress || 0}</p>
          <p className="text-[10px] text-zinc-500">Active pipeline</p>
        </div>

        {/* Submitted */}
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Submitted
          </span>
          <p className="text-2xl font-black text-yellow-400">{data?.summary?.submitted || 0}</p>
          <p className="text-[10px] text-zinc-500">Under review</p>
        </div>

        {/* Revision Required */}
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Revisions
          </span>
          <p className="text-2xl font-black text-orange-400">
            {data?.summary?.revisionRequired || 0}
          </p>
          <p className="text-[10px] text-zinc-500">Feedback required</p>
        </div>

        {/* Approved */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Approved
          </span>
          <p className="text-2xl font-black text-emerald-300">{data?.summary?.approved || 0}</p>
          <p className="text-[10px] text-emerald-400/80">Completed</p>
        </div>

        {/* Overdue */}
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
            Overdue
          </span>
          <p className="text-2xl font-black text-red-400">{data?.summary?.overdue || 0}</p>
          <p className="text-[10px] text-red-400/80">Past due date</p>
        </div>
      </div>

      {/* MILESTONE BADGES / GAMIFICATION SECTION */}
      {data?.badges && data.badges.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Milestones & Achievements</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                  badge.unlocked
                    ? 'bg-amber-500/10 border-amber-500/30 text-white shadow-md'
                    : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 opacity-60'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    badge.unlocked
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {badge.icon === 'Target' && <Target className="w-4 h-4" />}
                  {badge.icon === 'CheckCircle2' && <CheckCircle2 className="w-4 h-4" />}
                  {badge.icon === 'Zap' && <Zap className="w-4 h-4" />}
                  {badge.icon === 'Award' && <Award className="w-4 h-4" />}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate">{badge.title}</h4>
                    {badge.unlocked ? (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-zinc-500">Locked</span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-snug">{badge.description}</p>
                  <p className="text-[10px] font-mono font-bold text-indigo-400">{badge.progress}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MONTHLY COMPLETION TREND & PRIORITY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Monthly Completion Trend</h3>
              <p className="text-[11px] text-zinc-400">Approved deliverables over the past 6 months</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Completion:</span>
              <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                {data?.summary?.completionRate || 0}%
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.charts?.monthlyCompletionTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="approved"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Workload by Priority</h3>
            <p className="text-[11px] text-zinc-400">Active and completed tasks by urgency level</p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-xs font-semibold text-red-300">Urgent</span>
              </div>
              <span className="font-mono text-sm font-bold text-white">
                {data?.charts?.priorityCounts?.urgent || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-semibold text-amber-300">High</span>
              </div>
              <span className="font-mono text-sm font-bold text-white">
                {data?.charts?.priorityCounts?.high || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-xs font-semibold text-indigo-300">Medium</span>
              </div>
              <span className="font-mono text-sm font-bold text-white">
                {data?.charts?.priorityCounts?.medium || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">Low</span>
              </div>
              <span className="font-mono text-sm font-bold text-white">
                {data?.charts?.priorityCounts?.low || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TASK HISTORY TABLE WITH REVISION CYCLES & RESOURCE LINKS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Task History & Deliverables Log
            </h3>
            <p className="text-[11px] text-zinc-400">
              Deliverables assigned to you with revision iteration counts and linked resources
            </p>
          </div>

          {/* Quick Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setHistoryFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                historyFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              All ({data?.taskHistory?.length || 0})
            </button>
            <button
              onClick={() => setHistoryFilter('approved')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                historyFilter === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Approved ({data?.summary?.approved || 0})
            </button>
            <button
              onClick={() => setHistoryFilter('in_progress')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                historyFilter === 'in_progress'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              In Progress ({data?.summary?.inProgress || 0})
            </button>
            <button
              onClick={() => setHistoryFilter('revisions')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                historyFilter === 'revisions'
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Revisions ({data?.summary?.revisionRequired || 0})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-3 pl-2">Task Title</th>
                <th className="pb-3">Project / Dept</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">Due Date (DD/MM/YYYY)</th>
                <th className="pb-3 text-center">Revisions</th>
                <th className="pb-3 text-center">Resource</th>
                <th className="pb-3 text-right pr-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredHistory && filteredHistory.length > 0 ? (
                filteredHistory.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 pl-2 font-medium text-white max-w-xs truncate">
                      <Link
                        href={`/c/${companySlug}/my-tasks/${task.id}`}
                        className="hover:text-indigo-400 transition-colors"
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className="py-3.5 text-zinc-400">
                      <p className="truncate max-w-[140px] font-semibold text-zinc-300">{task.projectName}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{task.departmentName}</p>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                          task.priority === 'urgent'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : task.priority === 'high'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3.5 text-zinc-400 font-mono text-[11px]">
                      {task.due_date ? (
                        <span className={task.isOverdue ? 'text-red-400 font-bold' : ''}>
                          {formatDate(task.due_date, 'short')}
                          {task.isOverdue && ' (Overdue)'}
                        </span>
                      ) : (
                        'No deadline'
                      )}
                    </td>
                    <td className="py-3.5 text-center">
                      {task.revisionCycles > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold font-mono text-[10px]">
                          <RotateCcw className="w-3 h-3" />
                          <span>{task.revisionCycles}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600 font-mono text-[11px]">0</span>
                      )}
                    </td>
                    <td className="py-3.5 text-center">
                      {task.task_url ? (
                        <a
                          href={task.task_url.startsWith('http://') || task.task_url.startsWith('https://') ? task.task_url : `https://${task.task_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-[10px] font-medium transition-colors"
                          title="Open Resource Link"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Link</span>
                        </a>
                      ) : (
                        <span className="text-zinc-600 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          task.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : task.status === 'submitted_for_review'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : task.status === 'revision_required'
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {task.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-zinc-500">
                    No task history recorded for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
