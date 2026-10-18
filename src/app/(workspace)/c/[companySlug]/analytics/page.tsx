'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building,
  ListTodo,
  Clock,
  Filter,
  PieChart as PieIcon,
  Calendar,
  Layers,
  ArrowUpRight,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

interface AnalyticsSummary {
  totalEmployees: number;
  totalDepartments: number;
  totalTasks: number;
  completionRate: number;
  overdueCount: number;
  approvedCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  Assigned: '#3b82f6',
  'In Progress': '#6366f1',
  Submitted: '#eab308',
  Revision: '#f97316',
  Approved: '#10b981',
  Cancelled: '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#94a3b8',
  Medium: '#38bdf8',
  High: '#f59e0b',
  Urgent: '#ef4444',
};

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

export default function WorkspaceAnalyticsDashboard() {
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalEmployees: 0,
    totalDepartments: 0,
    totalTasks: 0,
    completionRate: 0,
    overdueCount: 0,
    approvedCount: 0,
  });

  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [charts, setCharts] = useState<any>({
    statusDistribution: [],
    priorityDistribution: [],
    departmentWorkload: [],
    employeeWorkload: [],
    dailyCompletionTrend: [],
    weeklyTrend: [],
  });

  // Filters
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRange, setSelectedRange] = useState('30d');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (selectedDept !== 'all') q.set('departmentId', selectedDept);
      if (selectedRange !== 'all') q.set('dateRange', selectedRange);
      if (selectedStatus !== 'all') q.set('status', selectedStatus);

      const res = await fetch(`/api/companies/${companySlug}/analytics/company?${q.toString()}`);

      if (res.status === 403) {
        setIsForbidden(true);
        setIsLoading(false);
        return;
      }

      const data = await res.json();

      if (data.success) {
        setSummary(data.summary);
        setCharts(data.charts);
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      fetchAnalytics();
    }
  }, [companySlug, selectedDept, selectedRange, selectedStatus]);

  if (isForbidden) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
          <Shield className="w-8 h-8" />
        </div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          403 Forbidden
        </span>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Company Performance Analytics are restricted to Workspace Administrators and Department Heads.
        </p>
        <Link
          href={`/c/${companySlug}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Workspace</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header and Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Company Performance Analytics
              </h1>
              <p className="text-xs text-zinc-400">
                Realtime throughput metrics, deliverable workload distribution, and team velocity.
              </p>
            </div>
          </div>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-2.5 bg-zinc-950/60 p-2 rounded-2xl border border-zinc-800/80">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 px-2">
            <Building className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-900">
                All Departments
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-zinc-900">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-[1px] h-4 bg-zinc-800" />

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="30d" className="bg-zinc-900">
                Last 30 Days
              </option>
              <option value="90d" className="bg-zinc-900">
                Last 90 Days
              </option>
              <option value="all" className="bg-zinc-900">
                All Time
              </option>
            </select>
          </div>

          <div className="w-[1px] h-4 bg-zinc-800" />

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 px-2">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-900">
                All Statuses
              </option>
              <option value="assigned" className="bg-zinc-900">
                Assigned
              </option>
              <option value="in_progress" className="bg-zinc-900">
                In Progress
              </option>
              <option value="submitted_for_review" className="bg-zinc-900">
                Submitted
              </option>
              <option value="approved" className="bg-zinc-900">
                Approved
              </option>
            </select>
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUMMARY KPI ROW (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Employees */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Employees</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{summary.totalEmployees}</p>
          <p className="text-[10px] text-zinc-500 font-medium">Active members</p>
        </div>

        {/* Total Departments */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Departments</span>
            <Building className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{summary.totalDepartments}</p>
          <p className="text-[10px] text-zinc-500 font-medium">Functional units</p>
        </div>

        {/* Total Tasks */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Deliverables</span>
            <ListTodo className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{summary.totalTasks}</p>
          <p className="text-[10px] text-zinc-500 font-medium">Total registered tasks</p>
        </div>

        {/* Completion Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-300">
            {summary.completionRate}%
          </p>
          <p className="text-[10px] text-emerald-400/80 font-medium">
            {summary.approvedCount} approved tasks
          </p>
        </div>

        {/* Overdue Count */}
        <div className="p-4 sm:p-5 rounded-2xl bg-red-500/10 border border-red-500/20 shadow-lg space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-red-300">{summary.overdueCount}</p>
          <p className="text-[10px] text-red-400/80 font-medium">Missed deadlines</p>
        </div>
      </div>

      {/* CHARTS GRID 1: Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* d) Daily Completion Trend (LineChart - Last 30 Days) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Daily Completion Velocity
              </h3>
              <p className="text-[11px] text-zinc-400">Approved deliverables over the past 30 days</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono">
              Last 30 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.dailyCompletionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="label" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="approved"
                  name="Approved Tasks"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#6366f1' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* e) Weekly Trend (BarChart - Last 12 Weeks: Assigned vs Approved) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Weekly Throughput Trend</h3>
              <p className="text-[11px] text-zinc-400">
                Tasks created (assigned) vs tasks approved per week
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
              12 Weeks
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="weekLabel" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="assigned" name="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHARTS GRID 2: Distributions (Status & Priority) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* a) Task Status Distribution (Donut / PieChart) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Task Status Distribution
              </h3>
              <p className="text-[11px] text-zinc-400">Lifecycle status across all company tasks</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {charts.statusDistribution.length === 0 ? (
              <p className="text-xs text-zinc-500">No task data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Pie
                    data={charts.statusDistribution}
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {charts.statusDistribution.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || '#6366f1'}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* f) Priority Distribution (PieChart) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Priority Distribution</h3>
              <p className="text-[11px] text-zinc-400">Urgency classification breakdown</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {charts.priorityDistribution.filter((p: any) => p.value > 0).length === 0 ? (
              <p className="text-xs text-zinc-500">No priority data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Pie
                    data={charts.priorityDistribution}
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {charts.priorityDistribution.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PRIORITY_COLORS[entry.name] || '#38bdf8'}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS GRID 3: Workloads (Department & Employee) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* b) Department Workload (Grouped BarChart) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Department Workload</h3>
              <p className="text-[11px] text-zinc-400">
                Task distribution across company departments
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {charts.departmentWorkload.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                No department task data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.departmentWorkload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="department" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="inProgress" name="In Progress" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="submitted" name="Submitted" fill="#eab308" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* c) Employee Workload (BarChart - Active task count, is_current=true) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Active Employee Workload</h3>
              <p className="text-[11px] text-zinc-400">
                Current active assignments (is_current=true)
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Top 10 Assignees</span>
          </div>

          <div className="h-72 w-full">
            {charts.employeeWorkload.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                No active employee assignments found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.employeeWorkload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="activeTasks" name="Active Tasks" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
