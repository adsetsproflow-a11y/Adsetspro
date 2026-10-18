'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Building,
  Briefcase,
  ChevronRight,
  ShieldAlert,
  Search,
  Filter,
  Paperclip,
  Check,
  RotateCcw,
} from 'lucide-react';

interface ReviewQueueTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  submitted_at: string;
  is_overdue: boolean;
  department_id: string | null;
  department_name: string;
  project_name: string | null;
  assignee_id: string | null;
  assignee_name: string;
  assignee_avatar: string | null;
  assignee_email: string | null;
  attachment_count: number;
}

interface ReviewStats {
  totalAwaitingReview: number;
  overdueSubmissions: number;
  reviewedToday: number;
}

export default function ReviewQueuePage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;

  const [tasks, setTasks] = useState<ReviewQueueTask[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalAwaitingReview: 0,
    overdueSubmissions: 0,
    reviewedToday: 0,
  });
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [userRole, setUserRole] = useState<string>('EMPLOYEE');

  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviewQueue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qParams = new URLSearchParams();
      if (departmentFilter !== 'all') qParams.set('department_id', departmentFilter);

      const res = await fetch(`/api/companies/${companySlug}/review?${qParams.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load review queue');
      }

      setTasks(data.tasks || []);
      setStats(
        data.stats || {
          totalAwaitingReview: 0,
          overdueSubmissions: 0,
          reviewedToday: 0,
        }
      );
      setDepartments(data.departments || []);
      setUserRole(data.userRole || 'EMPLOYEE');
    } catch (err: any) {
      console.error('Error fetching review queue:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      fetchReviewQueue();
    }
  }, [companySlug, departmentFilter]);

  const getPriorityBadge = (p: string) => {
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

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.assignee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.department_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoading && userRole === 'EMPLOYEE') {
    return (
      <div className="py-20 text-center text-zinc-500 space-y-4">
        <ShieldAlert className="w-12 h-12 mx-auto text-amber-400" />
        <h2 className="text-lg font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          The Task Review and Approval Queue is only accessible to Company Administrators and Department Heads.
        </p>
        <Link
          href={`/c/${companySlug}/my-tasks`}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl inline-flex items-center gap-2"
        >
          <span>Go to My Tasks</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Review & Sign-Off Queue
              </h1>
              <p className="text-xs text-zinc-400">
                Inspect submitted deliverables, verify acceptance criteria, and approve or request revisions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReviewQueue}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* HEADER STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Awaiting Review */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-amber-500/20 space-y-2 shadow-lg">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
            Total Awaiting Review
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats.totalAwaitingReview}</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-[11px] text-zinc-500">
            Deliverables currently submitted by team members
          </p>
        </div>

        {/* Overdue Submissions */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-red-500/30 space-y-2 shadow-lg bg-red-500/5">
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wider block">
            Overdue Submissions
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-red-400">{stats.overdueSubmissions}</span>
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-zinc-500">
            Submitted deliverables that have exceeded target deadline
          </p>
        </div>

        {/* Reviewed Today */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-emerald-500/30 space-y-2 shadow-lg bg-emerald-500/5">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            Reviewed Today
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">{stats.reviewedToday}</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[11px] text-zinc-500">
            Approvals and revision requests processed today
          </p>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deliverables by title, assignee, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Admin Department Filter */}
        {(userRole === 'COMPANY_ADMIN' || userRole === 'SUPER_ADMIN') && departments.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TASK QUEUE TABLE (Sorted: Overdue First, then Submission Date) */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3.5 sticky left-0 z-20 bg-zinc-950 min-w-[240px] max-w-[300px] border-r border-zinc-800 shadow-[4px_0_12px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-white font-bold tracking-wider">Deliverable Title</span>
                  </div>
                </th>
                <th className="px-5 py-3.5">Assignee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Submitted Date</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                    <span>Loading review queue...</span>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500 space-y-2">
                    <CheckCircle className="w-8 h-8 mx-auto text-emerald-500/40" />
                    <p className="text-zinc-300 font-semibold">Review queue is completely clear!</p>
                    <p className="text-xs text-zinc-500">
                      There are no pending submissions awaiting inspection.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => router.push(`/c/${companySlug}/review/${task.id}`)}
                    className={`transition-colors group cursor-pointer ${
                      task.is_overdue
                        ? 'bg-red-500/5 hover:bg-red-500/10'
                        : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    <td className="px-4 py-3.5 font-semibold text-white sticky left-0 z-10 bg-zinc-900 group-hover:bg-zinc-850 border-r border-zinc-800 shadow-[4px_0_12px_rgba(0,0,0,0.5)] transition-colors min-w-[240px] max-w-[300px]">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          {task.is_overdue && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping shrink-0" />
                          )}
                          <span className="line-clamp-1 group-hover:text-amber-400 transition-colors font-bold text-xs">
                            {task.title}
                          </span>
                          {task.attachment_count > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 shrink-0">
                              <Paperclip className="w-3 h-3 text-indigo-400" />
                              <span>{task.attachment_count}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          <span className="text-amber-400 font-semibold">#{task.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-zinc-300">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-indigo-500/30">
                          {task.assignee_name.slice(0, 1)}
                        </div>
                        <span className="truncate max-w-[120px]">{task.assignee_name}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{task.department_name}</span>
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-zinc-400">
                      {new Date(task.submitted_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
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
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/c/${companySlug}/review/${task.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
