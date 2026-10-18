'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ListTodo,
  Columns,
  List,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Play,
  Send,
  RotateCcw,
  RefreshCw,
  X,
  Briefcase,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface MyTaskItem {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  is_overdue: boolean;
  project_id: string | null;
  project_name: string | null;
  department_name: string;
  reviewer_name: string;
}

interface SummaryMetrics {
  totalAssigned: number;
  inProgress: number;
  overdue: number;
  submittedForReview: number;
  revisionRequired: number;
  approvedThisMonth: number;
}

export default function MyTasksDashboard() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;

  const [tasks, setTasks] = useState<MyTaskItem[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [summary, setSummary] = useState<SummaryMetrics>({
    totalAssigned: 0,
    inProgress: 0,
    overdue: 0,
    submittedForReview: 0,
    revisionRequired: 0,
    approvedThisMonth: 0,
  });

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qParams = new URLSearchParams();
      if (statusFilter !== 'all') qParams.set('status', statusFilter);
      if (priorityFilter !== 'all') qParams.set('priority', priorityFilter);
      if (projectFilter !== 'all') qParams.set('project_id', projectFilter);
      if (startDateFilter) qParams.set('startDate', startDateFilter);
      if (endDateFilter) qParams.set('endDate', endDateFilter);
      if (searchQuery.trim()) qParams.set('search', searchQuery.trim());

      const res = await fetch(`/api/companies/${companySlug}/my-tasks?${qParams.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load personal deliverables');

      setTasks(data.tasks || []);
      setSummary(
        data.summary || {
          totalAssigned: 0,
          inProgress: 0,
          overdue: 0,
          submittedForReview: 0,
          revisionRequired: 0,
          approvedThisMonth: 0,
        }
      );
      setProjects(data.projects || []);
    } catch (err: any) {
      console.error('Failed to load my-tasks:', err);
      setError(err.message || 'Error loading my-tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      fetchMyTasks();
    }
  }, [companySlug, statusFilter, priorityFilter, projectFilter, startDateFilter, endDateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMyTasks();
  };

  // Quick action from card/row to change status
  const handleQuickAction = async (taskId: string, targetStatus: string, note?: string) => {
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task status');
      fetchMyTasks();
    } catch (err: any) {
      console.error('Quick action error:', err);
      setError(err.message);
    }
  };

  const getPriorityBadgeStyle = (p: string) => {
    switch (p.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  const getStatusBadgeStyle = (st: string) => {
    switch (st) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'submitted_for_review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'in_progress':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'revision_required':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'blocked':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'cancelled':
        return 'bg-zinc-800 text-zinc-500 border-zinc-700';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
  };

  // Kanban column buckets
  const assignedTasks = tasks.filter((t) => t.status === 'assigned');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const submittedTasks = tasks.filter((t) => t.status === 'submitted_for_review');
  const revisionTasks = tasks.filter((t) => t.status === 'revision_required');

  return (
    <div className="space-y-6">
      {/* Page Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                My Workdesk
              </h1>
              <p className="text-xs text-zinc-400">
                Personal assigned deliverables, deadline calendar, and submission workflow.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMyTasks}
            disabled={isLoading}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Deliverables"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP SECTION — 6 SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Assigned */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1 shadow-lg">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Total Assigned
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-white">{summary.totalAssigned}</span>
            <ListTodo className="w-4 h-4 text-zinc-500" />
          </div>
        </div>

        {/* 2. In Progress */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-sky-500/20 space-y-1 shadow-lg">
          <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider block">
            In Progress
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-white">{summary.inProgress}</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
        </div>

        {/* 3. Overdue (RED) */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-red-500/30 space-y-1 shadow-lg bg-red-500/5">
          <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider block">
            Overdue
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-red-400">{summary.overdue}</span>
            <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
        </div>

        {/* 4. Submitted for Review */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-amber-500/20 space-y-1 shadow-lg">
          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">
            Under Review
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-white">{summary.submittedForReview}</span>
            <Send className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {/* 5. Revision Required (ORANGE) */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-orange-500/30 space-y-1 shadow-lg bg-orange-500/5">
          <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider block">
            Revision Req.
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-orange-400">
              {summary.revisionRequired}
            </span>
            <RotateCcw className="w-4 h-4 text-orange-400" />
          </div>
        </div>

        {/* 6. Approved This Month (GREEN) */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-emerald-500/30 space-y-1 shadow-lg bg-emerald-500/5">
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
            Approved (Month)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-400">
              {summary.approvedThisMonth}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your deliverables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {(statusFilter !== 'all' ||
            priorityFilter !== 'all' ||
            projectFilter !== 'all' ||
            startDateFilter ||
            endDateFilter ||
            searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setProjectFilter('all');
                setStartDateFilter('');
                setEndDateFilter('');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors self-start lg:self-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted_for_review">Submitted</option>
              <option value="revision_required">Revision Required</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Project
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Target Deadline
            </label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* VIEW RENDER: LIST VIEW OR KANBAN VIEW */}
      {viewMode === 'list' ? (
        /* LIST VIEW TABLE */
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Task Title</th>
                  <th className="px-5 py-3.5">Project</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                      <span>Loading your personal tasks...</span>
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-zinc-500 space-y-2">
                      <ListTodo className="w-8 h-8 mx-auto text-zinc-600" />
                      <p className="text-zinc-400 font-medium">No tasks assigned to you right now.</p>
                      <p className="text-xs text-zinc-600">
                        Check back when a manager assigns deliverables to your workdesk.
                      </p>
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => router.push(`/c/${companySlug}/my-tasks/${task.id}`)}
                      className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-3.5 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className="line-clamp-1 group-hover:text-indigo-400 transition-colors">
                            {task.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400">
                        {task.project_name ? (
                          <span className="inline-flex items-center gap-1.5 text-zinc-300">
                            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="truncate max-w-[140px]">{task.project_name}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityBadgeStyle(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        {task.due_date ? (
                          <span
                            className={
                              task.is_overdue
                                ? 'text-red-400 font-bold flex items-center gap-1'
                                : 'text-zinc-400'
                            }
                          >
                            {task.is_overdue && <AlertTriangle className="w-3 h-3 text-red-400" />}
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                            task.status
                          )}`}
                        >
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {task.status === 'assigned' && (
                            <button
                              onClick={() => handleQuickAction(task.id, 'in_progress', 'Started working')}
                              className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-400 hover:text-white border border-sky-500/30 text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                              title="Start Working"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Start</span>
                            </button>
                          )}
                          {task.status === 'revision_required' && (
                            <button
                              onClick={() => handleQuickAction(task.id, 'in_progress', 'Acknowledged revision')}
                              className="px-2.5 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                              title="Acknowledge & Start Revision"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Revise</span>
                            </button>
                          )}
                          <Link
                            href={`/c/${companySlug}/my-tasks/${task.id}`}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Column 1: Assigned */}
          <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Assigned</span>
              </span>
              <span className="text-xs font-mono font-bold text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded-lg">
                {assignedTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {assignedTasks.length === 0 ? (
                <p className="text-[11px] text-zinc-600 italic py-6 text-center">No assigned tasks</p>
              ) : (
                assignedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => router.push(`/c/${companySlug}/my-tasks/${task.id}`)}
                    className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-indigo-500/40 transition-all space-y-2.5 cursor-pointer shadow-md group"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors block line-clamp-2">
                      {task.title}
                    </span>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full border ${getPriorityBadgeStyle(task.priority)} font-bold`}>
                        {task.priority}
                      </span>
                      <span className="text-zinc-500 font-mono">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAction(task.id, 'in_progress', 'Started working from Kanban');
                      }}
                      className="w-full py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-400 hover:text-white border border-sky-500/30 text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start Working</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>In Progress</span>
              </span>
              <span className="text-xs font-mono font-bold text-sky-400 bg-zinc-950 px-2 py-0.5 rounded-lg">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {inProgressTasks.length === 0 ? (
                <p className="text-[11px] text-zinc-600 italic py-6 text-center">No tasks in progress</p>
              ) : (
                inProgressTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => router.push(`/c/${companySlug}/my-tasks/${task.id}`)}
                    className="p-3.5 rounded-xl bg-zinc-950/80 border border-sky-500/20 hover:border-sky-500/50 transition-all space-y-2.5 cursor-pointer shadow-md group"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors block line-clamp-2">
                      {task.title}
                    </span>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full border ${getPriorityBadgeStyle(task.priority)} font-bold`}>
                        {task.priority}
                      </span>
                      <span className={task.is_overdue ? 'text-red-400 font-bold font-mono' : 'text-zinc-500 font-mono'}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                    <Link
                      href={`/c/${companySlug}/my-tasks/${task.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[11px] font-bold inline-flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <Send className="w-3 h-3" />
                      <span>Submit for Review</span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Submitted */}
          <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Submitted</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-zinc-950 px-2 py-0.5 rounded-lg">
                {submittedTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {submittedTasks.length === 0 ? (
                <p className="text-[11px] text-zinc-600 italic py-6 text-center">No tasks awaiting review</p>
              ) : (
                submittedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => router.push(`/c/${companySlug}/my-tasks/${task.id}`)}
                    className="p-3.5 rounded-xl bg-zinc-950/80 border border-amber-500/20 hover:border-amber-500/50 transition-all space-y-2 cursor-pointer shadow-md group"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors block line-clamp-2">
                      {task.title}
                    </span>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full border ${getPriorityBadgeStyle(task.priority)} font-bold`}>
                        {task.priority}
                      </span>
                      <span className="text-amber-400/80 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Under Review</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 4: Revision Required */}
          <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                <span>Revision Req.</span>
              </span>
              <span className="text-xs font-mono font-bold text-orange-400 bg-zinc-950 px-2 py-0.5 rounded-lg">
                {revisionTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {revisionTasks.length === 0 ? (
                <p className="text-[11px] text-zinc-600 italic py-6 text-center">No revision requests</p>
              ) : (
                revisionTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => router.push(`/c/${companySlug}/my-tasks/${task.id}`)}
                    className="p-3.5 rounded-xl bg-zinc-950/80 border border-orange-500/30 hover:border-orange-500/60 transition-all space-y-2.5 cursor-pointer shadow-md group"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors block line-clamp-2">
                      {task.title}
                    </span>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full border ${getPriorityBadgeStyle(task.priority)} font-bold`}>
                        {task.priority}
                      </span>
                      <span className="text-orange-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Action Required</span>
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAction(task.id, 'in_progress', 'Started revision from Kanban');
                      }}
                      className="w-full py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Start Revision</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
