'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  Building,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { formatDate } from '@/lib/utils/dateFormat';

interface DepartmentAnalyticsData {
  department: {
    id: string;
    name: string;
    description: string;
  };
  summary: {
    totalEmployees: number;
    totalTasks: number;
    completionRate: number;
    overdueCount: number;
    awaitingReviewCount: number;
    approvedCount: number;
  };
  charts: {
    employeeStatusBreakdown: Array<{
      name: string;
      assigned: number;
      inProgress: number;
      submitted: number;
      approved: number;
      overdue: number;
    }>;
    completionTrend: Array<{
      weekLabel: string;
      approved: number;
    }>;
    overdueByEmployee: Array<{
      name: string;
      overdue: number;
    }>;
  };
  reviewQueue: Array<{
    id: string;
    title: string;
    priority: string;
    due_date: string | null;
    isOverdue: boolean;
    assigneeName: string;
  }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-bold text-white">{label || payload[0]?.name}</p>
        {payload.map((item: any, idx: number) => (
          <p key={idx} style={{ color: item.color || item.fill }} className="font-medium">
            {item.name}: <span className="font-mono font-bold text-white">{item.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DepartmentAnalyticsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const departmentId = params.departmentId as string;

  const [data, setData] = useState<DepartmentAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartmentAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/companies/${companySlug}/analytics/department/${departmentId}`
      );
      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to fetch department analytics');
      }

      setData(resData);
    } catch (err: any) {
      setError(err.message || 'Error loading department analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug && departmentId) {
      fetchDepartmentAnalytics();
    }
  }, [companySlug, departmentId]);

  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 max-w-md mx-auto border border-red-500/20 text-xs">
          {error}
        </div>
        <Link
          href={`/c/${companySlug}/departments/${departmentId}`}
          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Department</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/c/${companySlug}/departments/${departmentId}`}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {data?.department?.name || 'Department'} Analytics
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Department Head View
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Deliverable pipeline, member velocity, overdue bottlenecks, and review queue
            </p>
          </div>
        </div>

        <button
          onClick={fetchDepartmentAnalytics}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* SUMMARY KPI ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Team Size
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {data?.summary?.totalEmployees || 0}
          </p>
          <p className="text-[10px] text-zinc-500">Department members</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total Tasks
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {data?.summary?.totalTasks || 0}
          </p>
          <p className="text-[10px] text-zinc-500">All registered tasks</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Completion Rate
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-300">
            {data?.summary?.completionRate || 0}%
          </p>
          <p className="text-[10px] text-emerald-400/80">
            {data?.summary?.approvedCount || 0} approved tasks
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">
            Awaiting Review
          </span>
          <p className="text-2xl sm:text-3xl font-black text-yellow-300">
            {data?.summary?.awaitingReviewCount || 0}
          </p>
          <p className="text-[10px] text-yellow-400/80">Submitted for review</p>
        </div>

        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 shadow-md space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
            Overdue
          </span>
          <p className="text-2xl sm:text-3xl font-black text-red-300">
            {data?.summary?.overdueCount || 0}
          </p>
          <p className="text-[10px] text-red-400/80">Past deadline</p>
        </div>
      </div>

      {/* CHARTS GRID 1: Employee Breakdown & Completion Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* a) Employee Task Status Breakdown (Grouped BarChart) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Employee Task Status Breakdown
              </h3>
              <p className="text-[11px] text-zinc-400">
                Workload and delivery state per team member
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {data?.charts?.employeeStatusBreakdown &&
            data.charts.employeeStatusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.employeeStatusBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="assigned" name="Assigned" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar
                    dataKey="inProgress"
                    name="In Progress"
                    fill="#6366f1"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar dataKey="submitted" name="Submitted" fill="#eab308" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                No active employee task breakdown data available.
              </div>
            )}
          </div>
        </div>

        {/* b) Completion Trend (LineChart - Last 12 Weeks) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Department Completion Trend
              </h3>
              <p className="text-[11px] text-zinc-400">
                Deliverables approved per week over the last 12 weeks
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
              12 Weeks
            </span>
          </div>

          <div className="h-72 w-full">
            {data?.charts?.completionTrend && data.charts.completionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.charts.completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="weekLabel" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    name="Approved Tasks"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                No completion trend data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS GRID 2: Overdue by Employee & Review Queue Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* c) Overdue by Employee (Horizontal BarChart) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Overdue by Employee</h3>
              <p className="text-[11px] text-zinc-400">
                Unresolved tasks that passed their completion due date
              </p>
            </div>
            <span className="text-xs font-mono text-red-400 font-bold">
              {data?.summary?.overdueCount || 0} Total Overdue
            </span>
          </div>

          <div className="h-64 w-full">
            {data?.charts?.overdueByEmployee && data.charts.overdueByEmployee.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.overdueByEmployee} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" fontSize={10} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#71717a"
                    fontSize={10}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="overdue"
                    name="Overdue Tasks"
                    fill="#ef4444"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-xs text-zinc-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <p className="font-semibold text-zinc-300">All clear!</p>
                <p>No members currently have overdue deliverables.</p>
              </div>
            )}
          </div>
        </div>

        {/* d) Review Queue (Table with due dates) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Review Queue Bottlenecks
              </h3>
              <p className="text-[11px] text-zinc-400">
                Submitted deliverables awaiting inspection and sign-off
              </p>
            </div>
            <Link
              href={`/c/${companySlug}/review`}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
            >
              <span>Full Queue</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">Task</th>
                  <th className="pb-2.5">Assignee</th>
                  <th className="pb-2.5">Due Date (DD/MM/YYYY)</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {data?.reviewQueue && data.reviewQueue.length > 0 ? (
                  data.reviewQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-900/40">
                      <td className="py-2.5 font-medium text-white max-w-[140px] truncate">
                        {item.title}
                      </td>
                      <td className="py-2.5 text-zinc-400">{item.assigneeName}</td>
                      <td className="py-2.5 font-mono text-[11px]">
                        {item.due_date ? (
                          <span className={item.isOverdue ? 'text-red-400 font-bold' : 'text-zinc-400'}>
                            {formatDate(item.due_date, 'short')}
                            {item.isOverdue && ' (Overdue)'}
                          </span>
                        ) : (
                          <span className="text-zinc-600">No deadline</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/c/${companySlug}/review/${item.id}`}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all text-[11px] font-semibold inline-block"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-zinc-500">
                      No submissions currently awaiting review in this department.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
