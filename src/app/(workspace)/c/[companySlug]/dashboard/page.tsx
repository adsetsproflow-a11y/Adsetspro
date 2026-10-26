'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  ShieldAlert,
  BarChart3,
  SlidersHorizontal,
  Check,
  Eye,
  Flame,
  ShieldCheck,
  RotateCcw,
  LayoutGrid,
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
import CenterLoader from '@/components/common/CenterLoader';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/cache/clientCache';
import { createClient } from '@/lib/supabase/client';

export interface EmployeeTaskItem {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  is_overdue: boolean;
  project_id?: string;
}

export interface EmployeeWorkloadItem {
  employee_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  department_id?: string;
  department: string;
  completed: number;
  in_progress: number;
  under_review: number;
  revision_required?: number;
  assigned: number;
  blocked?: number;
  overdue: number;
  total: number;
  active_tasks?: number;
  completion_rate?: number;
  load_status?: 'overloaded' | 'balanced' | 'available' | 'overdue';
  tasks?: EmployeeTaskItem[];
}

export interface TaskLifecycleSummary {
  assigned: number;
  in_progress: number;
  submitted_for_review: number;
  revision_required: number;
  approved: number;
  blocked: number;
  overdue: number;
  total: number;
  activeTotal: number;
  completionRate: number;
}

interface DashboardData {
  company: {
    id: string;
    name: string;
    slug: string;
  };
  userRole?: string;
  departments?: { id: string; name: string }[];
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
    employeeWorkload?: EmployeeWorkloadItem[];
    taskLifecycle?: TaskLifecycleSummary;
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

const CustomEmployeeTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as EmployeeWorkloadItem;
    return (
      <div className="bg-zinc-950/95 border border-zinc-800 p-4 rounded-xl shadow-2xl backdrop-blur-md space-y-2.5 min-w-[240px]">
        <div className="border-b border-zinc-800 pb-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              {item.name}
            </p>
            {item.load_status === 'overloaded' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Heavy Load
              </span>
            )}
            {item.load_status === 'balanced' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Balanced
              </span>
            )}
            {item.load_status === 'available' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Available
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">{item.department || 'General'}</p>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Completed:
            </span>
            <span className="font-semibold text-emerald-400">{item.completed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span> In Progress:
            </span>
            <span className="font-semibold text-sky-400">{item.in_progress}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Under Review:
            </span>
            <span className="font-semibold text-amber-400">{item.under_review}</span>
          </div>
          {(item.revision_required || 0) > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span> In Revision:
              </span>
              <span className="font-semibold text-orange-400">{item.revision_required}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span> Assigned:
            </span>
            <span className="font-semibold text-purple-400">{item.assigned}</span>
          </div>
          {item.overdue > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
              <span className="text-rose-400 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Overdue:
              </span>
              <span className="font-bold text-rose-400">{item.overdue}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
          <span className="text-zinc-400">Completion Rate:</span>
          <span className="font-bold text-emerald-300">{item.completion_rate || 0}%</span>
        </div>
        <p className="text-[10px] text-zinc-500 text-center italic pt-0.5">Click row to inspect all tasks</p>
      </div>
    );
  }
  return null;
};

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Scalable Employee Workload Controls (50-100+ employees support)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'workload_desc' | 'overdue_desc' | 'review_desc' | 'rate_desc' | 'name_asc'>('workload_desc');
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Slide-over Drawer for Member Inspection
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWorkloadItem | null>(null);

  const fetchDashboardData = useCallback(
    async (force = false, silent = false) => {
      const cacheKey = `dashboard_${companySlug}`;
      if (!silent) {
        if (!force) {
          const cached = getCachedData<DashboardData>(cacheKey);
          if (cached) {
            setData(cached);
            setIsLoading(false);
          } else {
            setIsLoading(true);
          }
        } else {
          setIsLoading(true);
        }
      } else {
        setIsSyncing(true);
      }

      setError(null);
      try {
        const res = await fetch(`/api/companies/${companySlug}/dashboard`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Failed to load workspace dashboard data');
        }

        setCachedData(cacheKey, result);
        setData(result);
        setLastSyncedAt(new Date());

        // If an employee is currently open in drawer, update their object reference
        if (selectedEmployee) {
          const updatedEmp = (result.charts?.employeeWorkload || []).find(
            (e: EmployeeWorkloadItem) => e.employee_id === selectedEmployee.employee_id
          );
          if (updatedEmp) {
            setSelectedEmployee(updatedEmp);
          }
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Network error occurred while fetching metrics.');
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [companySlug, selectedEmployee]
  );

  // Initial load
  useEffect(() => {
    if (companySlug) {
      fetchDashboardData();
    }
  }, [companySlug]);

  // Real-Time Event Sync + Supabase Channel Subscription
  useEffect(() => {
    if (!companySlug) return;

    // 1. Listen for global task lifecycle events triggered within the workspace
    const handleLifecycleChange = () => {
      fetchDashboardData(true, true); // silent background refresh
    };

    window.addEventListener('task_lifecycle_changed', handleLifecycleChange);

    // 2. Refetch when window regains focus (e.g. user updated a task in another tab)
    const handleFocus = () => {
      fetchDashboardData(true, true);
    };
    window.addEventListener('focus', handleFocus);

    // 3. Supabase Realtime channel subscription for instant multi-user sync
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime_dashboard_${companySlug}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchDashboardData(true, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_assignments' },
        () => {
          fetchDashboardData(true, true);
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('task_lifecycle_changed', handleLifecycleChange);
      window.removeEventListener('focus', handleFocus);
      supabase.removeChannel(channel);
    };
  }, [companySlug, fetchDashboardData]);

  // Close inspection drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedEmployee) {
        setSelectedEmployee(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEmployee]);

  // Filtering, Searching, and Sorting logic for Scalable Employee Workload (50–100+ employees)
  const employeeWorkloadList = useMemo(() => {
    return data?.charts?.employeeWorkload || [];
  }, [data]);

  // Workload Capacity summary counts across all members
  const capacityCounts = useMemo(() => {
    let overloaded = 0;
    let balanced = 0;
    let available = 0;
    let withOverdue = 0;

    for (const emp of employeeWorkloadList) {
      if (emp.overdue > 0) withOverdue++;
      if (emp.load_status === 'overloaded') overloaded++;
      else if (emp.load_status === 'balanced') balanced++;
      else available++;
    }

    return { overloaded, balanced, available, withOverdue };
  }, [employeeWorkloadList]);

  // Check if any filter or custom sort is currently active
  const isFiltered = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedDeptFilter !== 'all' ||
      selectedStatusFilter !== 'all' ||
      sortBy !== 'workload_desc'
    );
  }, [searchQuery, selectedDeptFilter, selectedStatusFilter, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== '') count++;
    if (selectedDeptFilter !== 'all') count++;
    if (selectedStatusFilter !== 'all') count++;
    if (sortBy !== 'workload_desc') count++;
    return count;
  }, [searchQuery, selectedDeptFilter, selectedStatusFilter, sortBy]);

  const handleResetAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedDeptFilter('all');
    setSelectedStatusFilter('all');
    setSortBy('workload_desc');
    setCurrentPage(1);
  }, []);

  // Filter and sort the list
  const filteredAndSortedEmployees = useMemo(() => {
    let result = [...employeeWorkloadList];

    // 1. Department Filter
    if (selectedDeptFilter !== 'all') {
      result = result.filter(
        (e) => e.department_id === selectedDeptFilter || e.department === selectedDeptFilter
      );
    }

    // 2. Health / Load Status Filter
    if (selectedStatusFilter === 'overloaded') {
      result = result.filter((e) => e.load_status === 'overloaded');
    } else if (selectedStatusFilter === 'balanced') {
      result = result.filter((e) => e.load_status === 'balanced');
    } else if (selectedStatusFilter === 'available') {
      result = result.filter((e) => e.load_status === 'available');
    } else if (selectedStatusFilter === 'overdue') {
      result = result.filter((e) => e.overdue > 0);
    } else if (selectedStatusFilter === 'in_review') {
      result = result.filter((e) => e.under_review > 0);
    }

    // 3. Search Query (Name or Email)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      );
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === 'workload_desc') {
        return (b.active_tasks || b.total) - (a.active_tasks || a.total);
      }
      if (sortBy === 'overdue_desc') {
        return b.overdue - a.overdue || (b.active_tasks || 0) - (a.active_tasks || 0);
      }
      if (sortBy === 'review_desc') {
        return b.under_review - a.under_review;
      }
      if (sortBy === 'rate_desc') {
        return (b.completion_rate || 0) - (a.completion_rate || 0);
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [employeeWorkloadList, selectedDeptFilter, selectedStatusFilter, searchQuery, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDeptFilter, selectedStatusFilter, searchQuery, sortBy, pageSize]);

  // Pagination slice
  const totalEmployees = filteredAndSortedEmployees.length;
  const totalPages = pageSize === 9999 ? 1 : Math.ceil(totalEmployees / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    if (pageSize === 9999) return filteredAndSortedEmployees;
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedEmployees.slice(start, start + pageSize);
  }, [filteredAndSortedEmployees, currentPage, pageSize]);

  // Dynamic Chart Height bounded for clean responsiveness
  const dynamicChartHeight = useMemo(() => {
    return Math.max(260, Math.min(650, paginatedEmployees.length * 48));
  }, [paginatedEmployees.length]);

  if (isLoading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <CenterLoader
          message="Loading Workspace Dashboard..."
          subtitle="Aggregating real-time metrics, department workloads, and operational throughput"
          size="lg"
        />
      </div>
    );
  }

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

  const lifecycle = data?.charts?.taskLifecycle || {
    assigned: 0,
    in_progress: kpis.inProgressTasks,
    submitted_for_review: kpis.tasksAwaitingReview,
    revision_required: 0,
    approved: kpis.approvedThisMonth,
    blocked: 0,
    overdue: kpis.overdueTasks,
    total: 0,
    activeTotal: 0,
    completionRate: 0,
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
      case 'revision_required':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'in_progress':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'blocked':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP BAR: Title & Real-time Live Sync Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {data?.company?.name || 'Workspace'} Executive Dashboard
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isSyncing ? 'animate-ping' : ''}`}></span>
              {isSyncing ? 'Syncing...' : 'Real-time Live Sync'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time multi-tenant telemetry, automated task lifecycle tracking, and scalable team capacity analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastSyncedAt && (
            <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
              Updated {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchDashboardData(true, false)}
            disabled={isLoading || isSyncing}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-sm"
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
            <p className="text-[11px] text-red-300/80 mt-0.5">Please check database connectivity or refresh.</p>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-xs font-bold text-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ELABORATED TASK LIFECYCLE PIPELINE BANNER */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-32 bg-indigo-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Operational Task Lifecycle Pipeline
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              End-to-end throughput across assignment, execution, review verification, and deliverable sign-off.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-zinc-300 font-medium">Throughput:</span>
              <span className="font-bold text-emerald-400">{lifecycle.completionRate}% Accepted</span>
            </div>
          </div>
        </div>

        {/* Lifecycle Phase Step Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Phase 1: Assigned */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-purple-500/20 hover:border-purple-500/40 transition-colors space-y-1">
            <div className="flex items-center justify-between text-purple-300 text-[11px] font-semibold uppercase tracking-wider">
              <span>1. Assigned</span>
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            </div>
            <p className="text-2xl font-black text-white">{lifecycle.assigned}</p>
            <p className="text-[10px] text-zinc-500">Ready for pickup</p>
          </div>

          {/* Phase 2: In Progress */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-sky-500/20 hover:border-sky-500/40 transition-colors space-y-1">
            <div className="flex items-center justify-between text-sky-300 text-[11px] font-semibold uppercase tracking-wider">
              <span>2. In Progress</span>
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            </div>
            <p className="text-2xl font-black text-white">{lifecycle.in_progress}</p>
            <p className="text-[10px] text-zinc-500">Active execution</p>
          </div>

          {/* Phase 3: Under Review */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-amber-500/20 hover:border-amber-500/40 transition-colors space-y-1">
            <div className="flex items-center justify-between text-amber-300 text-[11px] font-semibold uppercase tracking-wider">
              <span>3. In Review</span>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            </div>
            <p className="text-2xl font-black text-amber-300">{lifecycle.submitted_for_review}</p>
            <p className="text-[10px] text-amber-400/70">Awaiting sign-off</p>
          </div>

          {/* Phase 4: Revision Required */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-orange-500/20 hover:border-orange-500/40 transition-colors space-y-1">
            <div className="flex items-center justify-between text-orange-300 text-[11px] font-semibold uppercase tracking-wider">
              <span>4. In Revision</span>
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            </div>
            <p className="text-2xl font-black text-white">{lifecycle.revision_required}</p>
            <p className="text-[10px] text-zinc-500">Feedback returned</p>
          </div>

          {/* Phase 5: Approved Deliverable */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors space-y-1">
            <div className="flex items-center justify-between text-emerald-300 text-[11px] font-semibold uppercase tracking-wider">
              <span>5. Approved</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-2xl font-black text-emerald-400">{lifecycle.approved}</p>
            <p className="text-[10px] text-zinc-500">Accepted outputs</p>
          </div>

          {/* Bottleneck Alert: Overdue & Blocked */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-rose-500/20 hover:border-rose-500/40 transition-colors space-y-1">
            <div className="flex items-center justify-between text-rose-300 text-[11px] font-semibold uppercase tracking-wider">
              <span>Escalation</span>
              <AlertTriangle className="w-3 h-3 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-rose-400">{lifecycle.overdue}</p>
            <p className="text-[10px] text-rose-300/80">Overdue deadlines</p>
          </div>
        </div>

        {/* Visual Pipeline Ribbon */}
        {lifecycle.total > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Pipeline Stage Distribution ({lifecycle.total} Total Tasks)</span>
              <span className="font-mono text-zinc-500">
                {lifecycle.activeTotal} Active • {lifecycle.approved} Completed
              </span>
            </div>
            <div className="h-2.5 w-full bg-zinc-800/80 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(lifecycle.approved / lifecycle.total) * 100}%` }}
                className="bg-emerald-500 transition-all"
                title={`Approved: ${lifecycle.approved}`}
              />
              <div
                style={{ width: `${(lifecycle.in_progress / lifecycle.total) * 100}%` }}
                className="bg-sky-400 transition-all"
                title={`In Progress: ${lifecycle.in_progress}`}
              />
              <div
                style={{ width: `${(lifecycle.submitted_for_review / lifecycle.total) * 100}%` }}
                className="bg-amber-400 transition-all"
                title={`Under Review: ${lifecycle.submitted_for_review}`}
              />
              <div
                style={{ width: `${(lifecycle.revision_required / lifecycle.total) * 100}%` }}
                className="bg-orange-400 transition-all"
                title={`In Revision: ${lifecycle.revision_required}`}
              />
              <div
                style={{ width: `${(lifecycle.assigned / lifecycle.total) * 100}%` }}
                className="bg-purple-500 transition-all"
                title={`Assigned: ${lifecycle.assigned}`}
              />
              <div
                style={{ width: `${(lifecycle.overdue / lifecycle.total) * 100}%` }}
                className="bg-rose-500 transition-all"
                title={`Overdue: ${lifecycle.overdue}`}
              />
            </div>
          </div>
        )}
      </div>

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
        {/* Overdue Tasks */}
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

      {/* SCALABLE EMPLOYEE WORKLOAD & LIFECYCLE SECTION (SCALES TO 50-100+ EMPLOYEES) */}
      <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-6 shadow-xl">
        {/* Header & View Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>
                {data?.userRole === 'EMPLOYEE'
                  ? 'My Task Lifecycle Progress'
                  : 'Employee Workload & Task Lifecycle Distribution'}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live capacity monitoring, bottleneck detection, and phase breakdown across team members.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'chart'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Stacked Bar Chart View"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Bar Chart</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Member Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Team Cards</span>
              </button>
            </div>

            {/* Total member pill */}
            <span className="text-xs bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 px-3 py-1.5 rounded-xl font-medium">
              {totalEmployees} {totalEmployees === 1 ? 'Member' : 'Members'}
            </span>

            {/* Reset All Filters header chip */}
            {isFiltered && (
              <button
                onClick={handleResetAllFilters}
                className="text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm animate-in fade-in"
                title="Reset all filters and sorting to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Reset All Filters</span>
                <span className="w-4 h-4 rounded-full bg-rose-500/30 text-rose-200 text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* WORKLOAD CAPACITY SUMMARY CARDS (Clickable Health Filters) */}
        {data?.userRole !== 'EMPLOYEE' && employeeWorkloadList.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'overloaded' ? 'all' : 'overloaded')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedStatusFilter === 'overloaded'
                  ? 'bg-rose-500/20 border-rose-500/60 ring-1 ring-rose-500/50'
                  : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between text-rose-400 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Overloaded
                </span>
                <span className="font-mono text-[10px] text-zinc-500">&gt; 7 tasks</span>
              </div>
              <p className="text-xl font-black text-white mt-1">{capacityCounts.overloaded}</p>
            </button>

            <button
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'balanced' ? 'all' : 'balanced')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedStatusFilter === 'balanced'
                  ? 'bg-emerald-500/20 border-emerald-500/60 ring-1 ring-emerald-500/50'
                  : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between text-emerald-400 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Balanced
                </span>
                <span className="font-mono text-[10px] text-zinc-500">3-7 tasks</span>
              </div>
              <p className="text-xl font-black text-white mt-1">{capacityCounts.balanced}</p>
            </button>

            <button
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'available' ? 'all' : 'available')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedStatusFilter === 'available'
                  ? 'bg-sky-500/20 border-sky-500/60 ring-1 ring-sky-500/50'
                  : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between text-sky-400 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span> Available
                </span>
                <span className="font-mono text-[10px] text-zinc-500">&lt; 3 tasks</span>
              </div>
              <p className="text-xl font-black text-white mt-1">{capacityCounts.available}</p>
            </button>

            <button
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'overdue' ? 'all' : 'overdue')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedStatusFilter === 'overdue'
                  ? 'bg-amber-500/20 border-amber-500/60 ring-1 ring-amber-500/50'
                  : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between text-amber-400 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> Overdue Risk
                </span>
                <span className="font-mono text-[10px] text-zinc-500">Has Overdue</span>
              </div>
              <p className="text-xl font-black text-amber-300 mt-1">{capacityCounts.withOverdue}</p>
            </button>
          </div>
        )}

        {/* SEARCH, FILTER, AND SORT CONTROLS TOOLBAR */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 pt-2">
          {/* Search Member input */}
          <div className="relative flex-1 min-w-[220px] w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member by name, email, or dept..."
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          {data?.departments && data.departments.length > 0 && data?.userRole !== 'EMPLOYEE' && (
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {/* Workload Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Capacities</option>
            <option value="overloaded">Overloaded (&gt; 7 tasks)</option>
            <option value="balanced">Balanced (3-7 tasks)</option>
            <option value="available">Available (&lt; 3 tasks)</option>
            <option value="overdue">Overdue Risk</option>
            <option value="in_review">In Review Queue</option>
          </select>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="workload_desc">Highest Workload</option>
              <option value="overdue_desc">Most Overdue</option>
              <option value="review_desc">Most In Review</option>
              <option value="rate_desc">Completion Rate %</option>
              <option value="name_asc">Name (A - Z)</option>
            </select>
          </div>

          {/* Reset All Filters Button */}
          <button
            onClick={handleResetAllFilters}
            disabled={!isFiltered}
            className={`px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              isFiltered
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 hover:text-white shadow-sm'
                : 'bg-zinc-950/60 border border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
            }`}
            title="Reset all filters, search query, and sorting to defaults"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isFiltered ? 'text-rose-400' : 'text-zinc-600'}`} />
            <span>Reset All Filters</span>
            {isFiltered && (
              <span className="w-4 h-4 rounded-full bg-rose-500/30 text-rose-200 text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Legend Pills */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400"></span>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>
            <span>Under Review</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-400"></span>
            <span>In Revision</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span>
            <span>Assigned</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
            <span>Overdue</span>
          </div>
        </div>

        {/* CONTENT: Bar Chart View vs. Member Cards View */}
        {filteredAndSortedEmployees.length === 0 ? (
          <div className="h-36 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800">
            <Users className="w-6 h-6 text-zinc-600 mb-1" />
            <p className="text-xs text-zinc-400 font-medium">No team members match your current filter.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDeptFilter('all');
                setSelectedStatusFilter('all');
              }}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold mt-1"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'chart' ? (
          <div className="space-y-4">
            <div style={{ height: `${dynamicChartHeight}px` }} className="w-full transition-all">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={paginatedEmployees}
                  margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      const clickedEmp = state.activePayload[0].payload as EmployeeWorkloadItem;
                      setSelectedEmployee(clickedEmp);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#71717a"
                    fontSize={11}
                    allowDecimals={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#d4d4d8"
                    fontSize={12}
                    tickLine={false}
                    width={130}
                    tickFormatter={(val) => (val && val.length > 16 ? `${val.substring(0, 14)}…` : val)}
                  />
                  <Tooltip content={<CustomEmployeeTooltip />} />
                  <Bar dataKey="completed" name="Completed" stackId="workload" fill="#10b981" />
                  <Bar dataKey="in_progress" name="In Progress" stackId="workload" fill="#38bdf8" />
                  <Bar dataKey="under_review" name="Under Review" stackId="workload" fill="#f59e0b" />
                  <Bar dataKey="revision_required" name="In Revision" stackId="workload" fill="#fb923c" />
                  <Bar dataKey="assigned" name="Assigned" stackId="workload" fill="#a855f7" />
                  <Bar dataKey="overdue" name="Overdue" stackId="workload" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-zinc-500 text-center italic">
              💡 Tip: Click on any employee's bar to inspect their full assigned task breakdown.
            </p>
          </div>
        ) : (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedEmployees.map((emp) => (
              <div
                key={emp.employee_id}
                onClick={() => setSelectedEmployee(emp)}
                className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3 cursor-pointer group hover:bg-zinc-950 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {emp.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400 truncate">{emp.department || 'General'}</p>
                    </div>
                  </div>

                  {emp.load_status === 'overloaded' && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                      Heavy Load
                    </span>
                  )}
                  {emp.load_status === 'balanced' && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      Balanced
                    </span>
                  )}
                  {emp.load_status === 'available' && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                      Available
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Progress</span>
                    <span className="font-bold text-emerald-400">{emp.completion_rate || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${emp.completion_rate || 0}%` }}
                      className="bg-emerald-400 rounded-full"
                    />
                  </div>
                </div>

                {/* Lifecycle counts row */}
                <div className="grid grid-cols-4 gap-1.5 text-center pt-1 border-t border-zinc-900 text-[11px]">
                  <div className="p-1 rounded bg-zinc-900/60">
                    <p className="text-[9px] text-zinc-500">Done</p>
                    <p className="font-bold text-emerald-400">{emp.completed}</p>
                  </div>
                  <div className="p-1 rounded bg-zinc-900/60">
                    <p className="text-[9px] text-zinc-500">Active</p>
                    <p className="font-bold text-sky-400">{emp.in_progress}</p>
                  </div>
                  <div className="p-1 rounded bg-zinc-900/60">
                    <p className="text-[9px] text-zinc-500">Review</p>
                    <p className="font-bold text-amber-400">{emp.under_review}</p>
                  </div>
                  <div className="p-1 rounded bg-zinc-900/60">
                    <p className="text-[9px] text-zinc-500">Overdue</p>
                    <p className="font-bold text-rose-400">{emp.overdue}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-400 group-hover:text-zinc-200">
                  <span>{emp.total} assigned tasks</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[10px]">
                    Inspect <Eye className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION CONTROLS (Enables smooth navigation across 50 to 100+ employees) */}
        {totalEmployees > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/60 text-xs">
            <div className="text-zinc-400">
              Showing <span className="text-white font-semibold">{pageSize === 9999 ? 1 : (currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="text-white font-semibold">
                {pageSize === 9999 ? totalEmployees : Math.min(currentPage * pageSize, totalEmployees)}
              </span>{' '}
              of <span className="text-white font-semibold">{totalEmployees}</span> team members
            </div>

            <div className="flex items-center gap-3">
              {/* Page size selector */}
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={9999}>All ({totalEmployees})</option>
                </select>
              </div>

              {/* Prev / Next buttons */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-zinc-400 text-xs">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* SECTION: Tasks Due Soon (Full Width & Responsive Table) */}
      <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">Tasks Due Soon</h2>
                {data?.tables.tasksDueSoon && data.tables.tasksDueSoon.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[10px] font-bold text-purple-300">
                    {data.tables.tasksDueSoon.length} Active
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Upcoming deadlines requiring immediate team focus and deliverable submission.
              </p>
            </div>
          </div>
          <Link
            href={`/c/${companySlug}/tasks`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 text-xs text-zinc-200 hover:text-white font-semibold transition-all self-start sm:self-auto shadow-sm"
          >
            <span>All Tasks</span>
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/40">
          <table className="w-full text-left text-xs min-w-[760px] border-collapse">
            <thead className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold bg-zinc-900/60 border-b border-zinc-800/80">
              <tr>
                <th className="py-3 px-4 font-semibold">Task</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Assignee</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Deadline</th>
                <th className="py-3 px-4 font-semibold text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {!data?.tables.tasksDueSoon || data.tables.tasksDueSoon.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto stroke-1" />
                    <p className="text-xs text-zinc-400 font-medium">All caught up! No upcoming deadlines.</p>
                  </td>
                </tr>
              ) : (
                data.tables.tasksDueSoon.map((task) => {
                  const dueDateObj = task.due_date ? new Date(task.due_date) : null;
                  const isOverdue = dueDateObj ? dueDateObj.getTime() < Date.now() : false;

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      {/* Task Title */}
                      <td className="py-3.5 px-4 font-semibold text-zinc-100 max-w-[260px]">
                        <Link
                          href={`/c/${companySlug}/tasks/${task.id}`}
                          className="hover:text-indigo-400 transition-colors line-clamp-1 block"
                          title={task.title}
                        >
                          {task.title}
                        </Link>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 text-[11px]">
                          {task.department_name || 'General'}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600/40 to-cyan-500/40 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {(task.assignee_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-zinc-300 max-w-[140px] truncate">
                            {task.assignee_name || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadgeStyle(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeStyle(
                            task.status
                          )}`}
                        >
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-[11px]">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatDate(task.due_date, 'short')} (Overdue)
                          </span>
                        ) : (
                          <span className="text-zinc-300">
                            {formatDate(task.due_date, 'short')}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Link
                          href={`/c/${companySlug}/tasks/${task.id}`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors inline-flex items-center justify-center"
                          title="Open Task"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLIDE-OVER INSPECTION DRAWER FOR INDIVIDUAL TEAM MEMBERS */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedEmployee(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col shadow-2xl space-y-5 overflow-y-auto">
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                    {selectedEmployee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {selectedEmployee.name}
                    </h3>
                    <p className="text-xs text-zinc-400">{selectedEmployee.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                        {selectedEmployee.department || 'General'}
                      </span>
                      {selectedEmployee.load_status === 'overloaded' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                          Overloaded ({selectedEmployee.active_tasks} active)
                        </span>
                      )}
                      {selectedEmployee.load_status === 'balanced' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          Balanced ({selectedEmployee.active_tasks} active)
                        </span>
                      )}
                      {selectedEmployee.load_status === 'available' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                          Available ({selectedEmployee.active_tasks} active)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Employee Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Completion Velocity
                  </span>
                  <p className="text-xl font-black text-emerald-400">
                    {selectedEmployee.completion_rate || 0}%
                  </p>
                  <p className="text-[10px] text-zinc-500">{selectedEmployee.completed} of {selectedEmployee.total} approved</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    In Review & Revision
                  </span>
                  <p className="text-xl font-black text-amber-400">
                    {(selectedEmployee.under_review || 0) + (selectedEmployee.revision_required || 0)}
                  </p>
                  <p className="text-[10px] text-zinc-500">Awaiting sign-off</p>
                </div>
              </div>

              {/* Workload Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Lifecycle Progress</span>
                  <span className="font-mono text-white text-[11px]">
                    {selectedEmployee.completed}/{selectedEmployee.total} Tasks
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${selectedEmployee.completion_rate || 0}%` }}
                    className="bg-emerald-400 rounded-full"
                  />
                </div>
              </div>

              {/* Assigned Tasks Breakdown List */}
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Assigned Deliverables ({selectedEmployee.tasks?.length || 0})
                  </h4>
                  <Link
                    href={`/c/${companySlug}/tasks`}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
                  >
                    View All Tasks <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="divide-y divide-zinc-800/80 overflow-y-auto flex-1 pr-1 space-y-2">
                  {!selectedEmployee.tasks || selectedEmployee.tasks.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 space-y-2">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-zinc-600" />
                      <p className="text-xs">No tasks currently assigned to this team member.</p>
                    </div>
                  ) : (
                    selectedEmployee.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-zinc-200 leading-snug line-clamp-2">
                            {task.title}
                          </p>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${getPriorityBadgeStyle(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                              task.status
                            )}`}
                          >
                            {task.status.replace(/_/g, ' ')}
                          </span>

                          <span
                            className={`font-mono text-[10px] ${
                              task.is_overdue ? 'text-rose-400 font-bold' : 'text-zinc-500'
                            }`}
                          >
                            {task.due_date ? formatDate(task.due_date, 'short') : 'No deadline'}
                            {task.is_overdue && ' (Overdue)'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
