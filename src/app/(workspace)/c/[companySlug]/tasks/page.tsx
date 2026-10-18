'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  RefreshCw,
  X,
  AlertCircle,
  Building,
  Briefcase,
  User,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dateFormat';

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  department_id: string | null;
  department_name: string;
  project_id: string | null;
  project_name: string | null;
  assignee_id: string | null;
  assignee_name: string;
  assignee_avatar: string | null;
}

export default function WorkspaceTasksPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('EMPLOYEE');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [projFilter, setProjFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qParams = new URLSearchParams();
      if (statusFilter !== 'all') qParams.set('status', statusFilter);
      if (priorityFilter !== 'all') qParams.set('priority', priorityFilter);
      if (deptFilter !== 'all') qParams.set('department_id', deptFilter);
      if (assigneeFilter !== 'all') qParams.set('assignee_id', assigneeFilter);
      if (projFilter !== 'all') qParams.set('project_id', projFilter);
      if (startDateFilter) qParams.set('startDate', startDateFilter);
      if (endDateFilter) qParams.set('endDate', endDateFilter);
      if (searchQuery.trim()) qParams.set('search', searchQuery.trim());
      qParams.set('page', page.toString());
      qParams.set('limit', '20');

      const [taskRes, deptRes, projRes, empRes] = await Promise.all([
        fetch(`/api/companies/${companySlug}/tasks?${qParams.toString()}`),
        fetch(`/api/companies/${companySlug}/departments`),
        fetch(`/api/companies/${companySlug}/projects`),
        fetch(`/api/companies/${companySlug}/employees`),
      ]);

      const taskData = await taskRes.json();
      const deptData = await deptRes.json();
      const projData = await projRes.json();
      const empData = await empRes.json();

      if (!taskRes.ok) throw new Error(taskData.error || 'Failed to fetch tasks');

      setTasks(taskData.tasks || []);
      setTotalPages(taskData.pagination?.totalPages || 1);
      setTotalTasks(taskData.pagination?.total || 0);
      setUserRole(taskData.userRole || 'EMPLOYEE');

      setDepartments(deptData.departments || []);
      setProjects(projData.projects || []);
      setEmployees(empData.employees || []);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      setError(err.message || 'Error loading tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      fetchTasks();
    }
  }, [
    companySlug,
    page,
    statusFilter,
    priorityFilter,
    deptFilter,
    assigneeFilter,
    projFilter,
    startDateFilter,
    endDateFilter,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!description.trim()) {
      setError('Task description is required');
      return;
    }
    if (!assigneeId) {
      setError('Please assign this task to a team member');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          department_id: departmentId || null,
          project_id: projectId || null,
          assignee_id: assigneeId,
          reviewer_id: reviewerId || null,
          priority,
          start_date: startDate || null,
          due_date: dueDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');

      // Reset form
      setTitle('');
      setDescription('');
      setDepartmentId('');
      setProjectId('');
      setAssigneeId('');
      setReviewerId('');
      setPriority('medium');
      setStartDate('');
      setDueDate('');
      setIsModalOpen(false);

      fetchTasks();
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  // KPI calculations
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const reviewCount = tasks.filter((t) => t.status === 'submitted_for_review').length;
  const approvedCount = tasks.filter((t) => t.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Task Management Hub
              </h1>
              <p className="text-xs text-zinc-400">
                Core deliverable tracking, lifecycle management, and departmental work queue.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTasks}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {Boolean(userRole) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 shadow-lg">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total Deliverables
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{totalTasks}</span>
            <CheckSquare className="w-4 h-4 text-zinc-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-sky-500/20 space-y-1.5 shadow-lg">
          <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
            In Progress
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{inProgressCount}</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-amber-500/20 space-y-1.5 shadow-lg">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            Awaiting Review
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{reviewCount}</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-emerald-500/20 space-y-1.5 shadow-lg">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Approved & Done
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{approvedCount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Filters Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Quick Clear Button */}
          {(statusFilter !== 'all' ||
            priorityFilter !== 'all' ||
            deptFilter !== 'all' ||
            assigneeFilter !== 'all' ||
            projFilter !== 'all' ||
            startDateFilter ||
            endDateFilter) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setDeptFilter('all');
                setAssigneeFilter('all');
                setProjFilter('all');
                setStartDateFilter('');
                setEndDateFilter('');
                setSearchQuery('');
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors self-start lg:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted_for_review">Under Review</option>
              <option value="revision_required">Revision Req.</option>
              <option value="approved">Approved</option>
              <option value="blocked">Blocked</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Assignee
            </label>
            <select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
            >
              <option value="all">All Assignees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.user_id || emp.id}>
                  {emp.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Project
            </label>
            <select
              value={projFilter}
              onChange={(e) => {
                setProjFilter(e.target.value);
                setPage(1);
              }}
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

          {/* Due Date Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Deadline (DD/MM/YYYY)
            </label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div ref={tableContainerRef} className="overflow-x-auto scroll-smooth">
          <table className="w-full text-left text-xs min-w-[960px]">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3.5 sticky left-0 z-20 bg-zinc-950 min-w-[240px] max-w-[300px] border-r border-zinc-800 shadow-[4px_0_12px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-white font-bold tracking-wider">Task Title & Brief</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 min-w-[140px]">Assignee</th>
                <th className="px-4 py-3.5 min-w-[130px]">Department</th>
                <th className="px-4 py-3.5 min-w-[140px]">Project</th>
                <th className="px-4 py-3.5 min-w-[90px]">Priority</th>
                <th className="px-4 py-3.5 min-w-[120px]">Status</th>
                <th className="px-4 py-3.5 min-w-[110px]">Due Date (DD/MM/YYYY)</th>
                <th className="px-4 py-3.5 text-right min-w-[80px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3.5 sticky left-0 z-10 bg-zinc-900 border-r border-zinc-800 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                        <div className="h-4 bg-zinc-800/80 rounded w-48" />
                      </td>
                      <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800/80 rounded w-28" /></td>
                      <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800/80 rounded w-24" /></td>
                      <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800/80 rounded w-20" /></td>
                      <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800/80 rounded w-16" /></td>
                      <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800/80 rounded w-20" /></td>
                      <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800/80 rounded w-20" /></td>
                      <td className="px-4 py-3.5 text-right"><div className="h-4 bg-zinc-800/80 rounded w-12 ml-auto" /></td>
                    </tr>
                  ))}
                </>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-zinc-500 space-y-3">
                    <CheckSquare className="w-10 h-10 mx-auto text-zinc-600" />
                    <div>
                      <p className="text-sm text-zinc-300 font-bold">No tasks found — Create your first task</p>
                      <p className="text-xs text-zinc-500 pt-1">
                        Get started by assigning deliverables to your team members.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Task</span>
                    </button>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => router.push(`/c/${companySlug}/tasks/${task.id}`)}
                    className="hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                  >
                    {/* Sticky Task Title Column - Always Visible in Front */}
                    <td className="px-4 py-3.5 font-semibold text-white sticky left-0 z-10 bg-zinc-900 group-hover:bg-zinc-850 border-r border-zinc-800 shadow-[4px_0_12px_rgba(0,0,0,0.5)] transition-colors min-w-[240px] max-w-[300px]">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <Link
                            href={`/c/${companySlug}/tasks/${task.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate block text-xs hover:underline"
                            title={task.title}
                          >
                            {task.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono pl-5">
                          <span className="text-indigo-400/90 font-semibold">#{task.id.slice(0, 8)}</span>
                          {task.description && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[170px] font-sans text-zinc-400">
                                {task.description}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="px-4 py-3.5 text-zinc-300">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-indigo-500/30">
                          {task.assignee_name.slice(0, 1)}
                        </div>
                        <span className="truncate max-w-[120px] font-medium">{task.assignee_name}</span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5 text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate max-w-[120px]">{task.department_name}</span>
                      </span>
                    </td>

                    {/* Project */}
                    <td className="px-4 py-3.5 text-zinc-400">
                      {task.project_name ? (
                        <span className="inline-flex items-center gap-1.5 text-zinc-300">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{task.project_name}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600 italic">None</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                          task.status
                        )}`}
                      >
                        {task.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3.5 font-mono text-zinc-300 whitespace-nowrap">
                      {task.due_date ? formatDate(task.due_date, 'short') : '—'}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/c/${companySlug}/tasks/${task.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Showing {tasks.length} of {totalTasks} deliverables
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-semibold transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="font-mono text-zinc-300">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-semibold transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Create New Task</h2>
                  <p className="text-xs text-zinc-400">
                    Define deliverables, assign responsibility, and designate reviewer.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Task Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Hero Section Illustrations"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed specifications, references, and acceptance criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {/* Department & Project Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">General / None</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Project (Optional)</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">No Project Linked</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee & Reviewer Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Assign To <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.user_id || emp.id}>
                        {emp.full_name} ({emp.designation || 'Member'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Reviewer (Defaults to Dept Head)
                  </label>
                  <select
                    value={reviewerId}
                    onChange={(e) => setReviewerId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Auto-assign Dept Head / Creator</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.user_id || emp.id}>
                        {emp.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority, Start Date, Due Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Start Date <span className="text-zinc-500 font-normal">(DD/MM/YYYY)</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Due Date <span className="text-zinc-500 font-normal">(DD/MM/YYYY)</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Task...</span>
                    </>
                  ) : (
                    <span>Create & Assign Task</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
