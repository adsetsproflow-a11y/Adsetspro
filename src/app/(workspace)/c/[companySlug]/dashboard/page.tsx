'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Building,
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Activity,
  Layers,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dateFormat';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardData {
  company: {
    id: string;
    name: string;
    slug: string;
  };
  kpis: {
    totalEmployees: number;
    totalDepartments: number;
    activeProjects: number;
    tasksAwaitingReview: number;
    overdueTasks: number;
    inProgressTasks: number;
    approvedThisMonth: number;
    upcomingDeadlines: number;
  };
  charts: {
    taskStatusDistribution: { name: string; value: number; color: string }[];
    departmentWorkload: { department: string; count: number }[];
    weeklyCompletionTrend: { week: string; completed: number }[];
    priorityDistribution: { priority: string; count: number; color: string }[];
  };
  tables: {
    recentActivities: {
      id: string;
      action: string;
      target_type: string;
      actor_name: string;
      created_at: string;
      details: any;
    }[];
    tasksDueSoon: {
      id: string;
      title: string;
      priority: string;
      status: string;
      due_date: string;
      department_name: string;
      assignee_name: string;
    }[];
  };
}

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/dashboard`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to load workspace dashboard data');
      }

      setData(result);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Network error occurred while fetching metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      fetchDashboardData();
    }
  }, [companySlug]);

  const kpis = data?.kpis || {
    totalEmployees: 0,
    totalDepartments: 0,
    activeProjects: 0,
    tasksAwaitingReview: 0,
    overdueTasks: 0,
    inProgressTasks: 0,
    approvedThisMonth: 0,
    upcomingDeadlines: 0,
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'submitted_for_review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'in_progress':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'blocked':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-3 h-3" />
              Executive Pulse
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {data?.company?.name || 'Company'} Administration Hub
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Real-time multi-department operational overview, task distribution, and throughput trends
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* ROW 1: Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-zinc-900/80 border border-indigo-500/20 space-y-2 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Total Employees
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{kpis.totalEmployees}</p>
          <p className="text-[11px] text-zinc-500">Active company staff</p>
        </div>

        {/* Total Departments */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-zinc-900/60 to-zinc-900/80 border border-cyan-500/20 space-y-2 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              Total Departments
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{kpis.totalDepartments}</p>
          <p className="text-[11px] text-zinc-500">Active divisions</p>
        </div>

        {/* Active Projects */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-zinc-900/60 to-zinc-900/80 border border-emerald-500/20 space-y-2 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Active Projects
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{kpis.activeProjects}</p>
          <p className="text-[11px] text-zinc-500">In-flight initiatives</p>
        </div>

        {/* Tasks Awaiting Review */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-zinc-900/60 to-zinc-900/80 border border-amber-500/30 space-y-2 relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Awaiting Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-300">{kpis.tasksAwaitingReview}</p>
          <Link
            href={`/c/${companySlug}/review`}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
          >
            Review Queue <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ROW 2: Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overdue Tasks (Red highlight) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-red-950/50 to-red-900/20 border-2 border-red-500/40 space-y-2 relative shadow-lg shadow-red-500/5">
          <div className="flex items-center justify-between text-red-300">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue Tasks</span>
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
          <p className="text-3xl font-black text-red-400">{kpis.overdueTasks}</p>
          <p className="text-[11px] text-red-300/80">Requires escalation</p>
        </div>

        {/* In Progress Tasks */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              In Progress
            </span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-black text-white">{kpis.inProgressTasks}</p>
          <p className="text-[11px] text-zinc-500">Actively being worked</p>
        </div>

        {/* Approved This Month */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Approved This Month
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{kpis.approvedThisMonth}</p>
          <p className="text-[11px] text-zinc-500">Accepted deliverables</p>
        </div>

        {/* Upcoming Deadlines (Next 7 days) */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Upcoming Deadlines
            </span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-purple-300">{kpis.upcomingDeadlines}</p>
          <p className="text-[11px] text-zinc-500">Due within next 7 days</p>
        </div>
      </div>

      {/* ROW 3: Charts (Donut Task Status & Bar Department Workload) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Task Status Distribution */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span>Task Status Distribution</span>
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">Status Breakdown</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.charts.taskStatusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(data?.charts.taskStatusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(val) => <span className="text-xs text-zinc-400">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Department Workload */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              <span>Department Workload</span>
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">Tasks per division</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.charts.departmentWorkload || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="department"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 4: Charts (Line Weekly Trend & Bar Priority Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Weekly Task Completion Trend */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Weekly Task Completion Trend</span>
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">Last 8 Weeks</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data?.charts.weeklyCompletionTrend || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="week" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Priority Distribution */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Priority Distribution</span>
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">By Urgency Level</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.charts.priorityDistribution || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="priority" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(data?.charts.priorityDistribution || []).map((entry, index) => (
                    <Cell key={`pcell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 5: Tables (Recent Activity Feed & Tasks Due Soon) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Recent Activity Feed</span>
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">Live Audit Trail</span>
          </div>

          <div className="divide-y divide-zinc-800/60 max-h-96 overflow-y-auto pr-1">
            {(!data?.tables.recentActivities || data.tables.recentActivities.length === 0) ? (
              <p className="text-xs text-zinc-500 py-10 text-center">No recent activities recorded yet.</p>
            ) : (
              data.tables.recentActivities.map((act) => (
                <div key={act.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">{act.actor_name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-indigo-400">
                      {act.action}
                    </span>
                    <span className="text-xs text-zinc-400 capitalize">on {act.target_type}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks Due Soon (Next 5 tasks by due date) */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Tasks Due Soon</span>
            </h2>
            <Link
              href={`/c/${companySlug}/tasks`}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              All Tasks →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-800/80">
                <tr>
                  <th className="pb-2.5">Task</th>
                  <th className="pb-2.5">Priority</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Deadline (DD/MM/YYYY)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {(!data?.tables.tasksDueSoon || data.tables.tasksDueSoon.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">
                      No upcoming task deadlines.
                    </td>
                  </tr>
                ) : (
                  data.tables.tasksDueSoon.map((task) => (
                    <tr key={task.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 font-semibold text-zinc-200">
                        <div className="truncate max-w-[180px]">{task.title}</div>
                        <div className="text-[10px] text-zinc-500">
                          {task.department_name} • {task.assignee_name}
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityBadgeStyle(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                            task.status
                          )}`}
                        >
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right text-zinc-400 font-mono text-[11px]">
                        {formatDate(task.due_date, 'short')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
