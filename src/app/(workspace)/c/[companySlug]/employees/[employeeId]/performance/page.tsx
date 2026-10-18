'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ListTodo,
  TrendingUp,
  RefreshCw,
  Calendar,
  Layers,
  ChevronRight,
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
  };
  charts: {
    monthlyCompletionTrend: Array<{
      month: string;
      approved: number;
    }>;
  };
  taskHistory: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
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

export default function EmployeePerformancePage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const employeeId = params.employeeId as string;

  const [data, setData] = useState<EmployeePerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/companies/${companySlug}/analytics/employee/${employeeId}`
      );
      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to fetch performance data');
      }

      setData(resData);
    } catch (err: any) {
      setError(err.message || 'Error loading employee performance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug && employeeId) {
      fetchPerformance();
    }
  }, [companySlug, employeeId]);

  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 max-w-md mx-auto border border-red-500/20 text-xs">
          {error}
        </div>
        <Link
          href={`/c/${companySlug}/employees`}
          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employees</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/c/${companySlug}/employees`}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {data?.employee?.name || 'Employee Performance'}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Audited Performance
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">{data?.employee?.email}</p>
          </div>
        </div>

        <button
          onClick={fetchPerformance}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* SUMMARY KPI CARDS (Assigned, In Progress, Submitted, Approved, Overdue) */}
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
          <p className="text-[10px] text-zinc-500">Feedback cycles</p>
        </div>

        {/* Approved */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Approved
          </span>
          <p className="text-2xl font-black text-emerald-300">{data?.summary?.approved || 0}</p>
          <p className="text-[10px] text-emerald-400/80">Completed deliverables</p>
        </div>

        {/* Overdue */}
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
            Overdue
          </span>
          <p className="text-2xl font-black text-red-400">{data?.summary?.overdue || 0}</p>
          <p className="text-[10px] text-red-400/80">Missed deadlines</p>
        </div>
      </div>

      {/* MONTHLY COMPLETION TREND (LineChart) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Monthly Completion Trend</h3>
            <p className="text-[11px] text-zinc-400">Approved deliverables over the past 6 months</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400">Completion Rate:</span>
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

      {/* TASK HISTORY TABLE WITH REVISION CYCLES */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Task History & Revision Log
            </h3>
            <p className="text-[11px] text-zinc-400">
              Deliverables assigned to this employee with revision iteration counts
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {data?.taskHistory?.length || 0} total tasks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-3 pl-2">Task Title</th>
                <th className="pb-3">Project / Dept</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">Due Date (DD/MM/YYYY)</th>
                <th className="pb-3 text-center">Revision Cycles</th>
                <th className="pb-3 text-right pr-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {data?.taskHistory && data.taskHistory.length > 0 ? (
                data.taskHistory.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 pl-2 font-medium text-white max-w-xs truncate">
                      <Link
                        href={`/c/${companySlug}/tasks/${task.id}`}
                        className="hover:text-indigo-400 transition-colors"
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className="py-3.5 text-zinc-400">
                      <p className="truncate max-w-[140px]">{task.projectName}</p>
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
                  <td colSpan={6} className="py-8 text-center text-xs text-zinc-500">
                    No task history recorded for this employee.
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
