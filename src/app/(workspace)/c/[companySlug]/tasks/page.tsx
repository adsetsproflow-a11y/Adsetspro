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
  Trash2,
  LayoutGrid,
  Table,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dateFormat';
import CenterLoader from '@/components/common/CenterLoader';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/cache/clientCache';

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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

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

  // Deletion States
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const handleToggleSelect = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id));
    }
  };

  const handleDeleteIndividual = async (task: TaskItem) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${task.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete task');
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setSelectedTaskIds((prev) => prev.filter((id) => id !== task.id));
      setTaskToDelete(null);
      setTotalTasks((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err.message || 'Error deleting task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTaskIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.length} selected task(s)?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds: selectedTaskIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete selected tasks');
      setTasks((prev) => prev.filter((t) => !selectedTaskIds.includes(t.id)));
      setTotalTasks((prev) => Math.max(0, prev - selectedTaskIds.length));
      setSelectedTaskIds([]);
    } catch (err: any) {
      alert(err.message || 'Error deleting selected tasks');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAllTasks = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearAll: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear all tasks');
      setTasks([]);
      setSelectedTaskIds([]);
      setTotalTasks(0);
      setIsClearAllModalOpen(false);
      setDeleteConfirmationText('');
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Error clearing tasks');
    } finally {
      setIsDeleting(false);
    }
  };

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

  const fetchTasks = async (force = false) => {
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

    const cacheKey = `tasks_${companySlug}_${qParams.toString()}`;

    if (!force) {
      const cached = getCachedData<any>(cacheKey);
      if (cached) {
        setTasks(cached.tasks || []);
        setTotalPages(cached.totalPages || 1);
        setTotalTasks(cached.totalTasks || 0);
        setUserRole(cached.userRole || 'EMPLOYEE');
        if (cached.departments) setDepartments(cached.departments);
        if (cached.projects) setProjects(cached.projects);
        if (cached.employees) setEmployees(cached.employees);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    } else {
      setIsLoading(true);
    }

    setError(null);
    try {
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

      const loadedTasks = taskData.tasks || [];
      const loadedPages = taskData.pagination?.totalPages || 1;
      const loadedTotal = taskData.pagination?.total || 0;
      const loadedRole = taskData.userRole || 'EMPLOYEE';
      const loadedDepts = deptData.departments || [];
      const loadedProjs = projData.projects || [];
      const loadedEmps = empData.employees || [];

      setTasks(loadedTasks);
      setTotalPages(loadedPages);
      setTotalTasks(loadedTotal);
      setUserRole(loadedRole);
      setDepartments(loadedDepts);
      setProjects(loadedProjs);
      setEmployees(loadedEmps);

      setCachedData(cacheKey, {
        tasks: loadedTasks,
        totalPages: loadedPages,
        totalTasks: loadedTotal,
        userRole: loadedRole,
        departments: loadedDepts,
        projects: loadedProjs,
        employees: loadedEmps,
      });
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

      invalidateCache('tasks_' + companySlug);
      invalidateCache('dashboard_' + companySlug);
      fetchTasks(true);
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'submitted_for_review':
        return {
          label: 'Under Review',
          classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          classes: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          dot: 'bg-sky-400 animate-pulse',
        };
      case 'revision_required':
        return {
          label: 'Revision Req.',
          classes: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          dot: 'bg-orange-400',
        };
      case 'blocked':
        return {
          label: 'Blocked',
          classes: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          classes: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          dot: 'bg-zinc-500',
        };
      default:
        return {
          label: 'Assigned',
          classes: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          dot: 'bg-indigo-400',
        };
    }
  };

  const renderStatusBadge = (status: string) => {
    const config = getStatusBadgeConfig(status);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap shadow-xs ${config.classes}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
        <span>{config.label}</span>
      </span>
    );
  };

  const getPriorityBadgeConfig = (p: string) => {
    switch (p.toLowerCase()) {
      case 'urgent':
        return {
          label: 'Urgent',
          classes: 'bg-red-500/10 text-red-400 border-red-500/30',
        };
      case 'high':
        return {
          label: 'High',
          classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      case 'medium':
        return {
          label: 'Medium',
          classes: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
        };
      default:
        return {
          label: 'Low',
          classes: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        };
    }
  };

  const renderPriorityBadge = (p: string) => {
    const config = getPriorityBadgeConfig(p);
    return (
      <span
        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border whitespace-nowrap shadow-xs ${config.classes}`}
      >
        {config.label}
      </span>
    );
  };

  const renderDateBadge = (dueDate: string | null) => {
    if (!dueDate) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/40 border border-zinc-800 text-zinc-400 text-xs font-medium whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span>No deadline</span>
        </span>
      );
    }

    const due = new Date(dueDate);
    const now = new Date();
    const isPast = due.getTime() < now.getTime() && (now.getTime() - due.getTime() > 86400000);
    const isToday = due.toDateString() === now.toDateString();

    if (isPast) {
      return (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-semibold whitespace-nowrap"
          title={`Overdue: ${formatDate(dueDate, 'medium')}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
          <span>{formatDate(dueDate, 'short')}</span>
          <span className="text-[9px] font-sans font-bold uppercase bg-red-500/20 px-1 py-0.2 rounded text-red-300">
            Overdue
          </span>
        </div>
      );
    }

    if (isToday) {
      return (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold whitespace-nowrap"
          title="Due Today"
        >
          <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>{formatDate(dueDate, 'short')}</span>
          <span className="text-[9px] font-sans font-bold uppercase bg-amber-500/20 px-1 py-0.2 rounded text-amber-200">
            Today
          </span>
        </div>
      );
    }

    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-850/80 border border-zinc-700/60 text-zinc-200 text-xs font-mono font-medium whitespace-nowrap hover:border-zinc-600 transition-colors"
        title={formatDate(dueDate, 'medium')}
      >
        <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>{formatDate(dueDate, 'short')}</span>
      </div>
    );
  };

  // KPI calculations
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const reviewCount = tasks.filter((t) => t.status === 'submitted_for_review').length;
  const approvedCount = tasks.filter((t) => t.status === 'approved').length;

  if (isLoading && tasks.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <CenterLoader
          message="Loading Deliverables & Tasks..."
          subtitle="Fetching work items, priorities, assignees, and review stages"
          size="lg"
        />
      </div>
    );
  }

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

        <div className="flex items-center flex-wrap gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Table Spreadsheet View"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Card Grid View (Great for Mobile & Tablet)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <button
            onClick={() => fetchTasks(true)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {(userRole === 'COMPANY_ADMIN' || userRole === 'SUPER_ADMIN') && totalTasks > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              disabled={isDeleting}
              className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Clear all tasks for this company workspace"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}

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
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors self-start lg:self-auto cursor-pointer"
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
              Deadline Filter
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 [color-scheme:dark] focus:outline-none focus:border-indigo-500 cursor-pointer"
              />
              {endDateFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setEndDateFilter('');
                    setPage(1);
                  }}
                  className="absolute right-7 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-white"
                  title="Clear deadline filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks View: Table View or Cards View */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div ref={tableContainerRef} className="overflow-x-auto scroll-smooth">
            <table className="w-full text-left text-xs min-w-[920px]">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3.5 w-[280px]">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={tasks.length > 0 && selectedTaskIds.length === tasks.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        title={selectedTaskIds.length === tasks.length ? 'Deselect all' : 'Select all'}
                      />
                      <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-white font-bold tracking-wider">Task Title & Brief</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">Assignee</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[110px]">Department</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[120px]">Project</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[85px]">Priority</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">Status</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[120px]">Due Date (DD/MM/YYYY)</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[100px] pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3.5">
                          <div className="h-4 bg-zinc-800/80 rounded w-48" />
                        </td>
                        <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800/80 rounded w-28" /></td>
                        <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800/80 rounded w-24" /></td>
                        <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800/80 rounded w-20" /></td>
                        <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800/80 rounded w-16" /></td>
                        <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800/80 rounded w-20" /></td>
                        <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800/80 rounded w-20" /></td>
                        <td className="px-4 py-3.5 text-right pr-5"><div className="h-4 bg-zinc-800/80 rounded w-14 ml-auto" /></td>
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
                      className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                    >
                      {/* Task Title & Brief */}
                      <td className="px-4 py-3.5 font-semibold text-white align-middle max-w-[320px]">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.includes(task.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => handleToggleSelect(task.id)}
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer mt-0.5 shrink-0"
                            title="Select task"
                          />
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/c/${companySlug}/tasks/${task.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate block text-xs hover:underline"
                                title={task.title}
                              >
                                {task.title}
                              </Link>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
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
                        </div>
                      </td>

                      {/* Assignee */}
                      <td className="px-4 py-3.5 text-zinc-300 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-indigo-500/30">
                            {task.assignee_name.slice(0, 1)}
                          </div>
                          <span className="truncate max-w-[130px] font-medium text-xs">{task.assignee_name}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 text-zinc-400 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300">
                          <Building className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate max-w-[120px]">{task.department_name}</span>
                        </span>
                      </td>

                      {/* Project */}
                      <td className="px-4 py-3.5 text-zinc-400 align-middle whitespace-nowrap">
                        {task.project_name ? (
                          <span className="inline-flex items-center gap-1.5 text-zinc-300 text-xs">
                            <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate max-w-[130px]">{task.project_name}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600 italic text-xs">None</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        {renderPriorityBadge(task.priority)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        {renderStatusBadge(task.status)}
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        {renderDateBadge(task.due_date)}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right align-middle whitespace-nowrap pr-5">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/c/${companySlug}/tasks/${task.id}`}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold transition-colors inline-flex items-center gap-1 text-xs border border-zinc-700/60"
                          >
                            <span>View</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskToDelete(task);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700/60 transition-colors cursor-pointer"
                            title={`Delete "${task.title}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
      ) : (
        /* CARDS VIEW (Responsive grid for mobile, tablet, and visual scanning) */
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 animate-pulse">
                  <div className="h-4 bg-zinc-800 rounded w-1/3" />
                  <div className="h-5 bg-zinc-800 rounded w-3/4" />
                  <div className="h-4 bg-zinc-800 rounded w-1/2" />
                  <div className="pt-2 border-t border-zinc-800 flex justify-between">
                    <div className="h-6 bg-zinc-800 rounded w-20" />
                    <div className="h-6 bg-zinc-800 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 space-y-3 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              <CheckSquare className="w-10 h-10 mx-auto text-zinc-600" />
              <p className="text-sm text-zinc-300 font-bold">No deliverables found</p>
              <p className="text-xs text-zinc-500">Create your first task or change your filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => router.push(`/c/${companySlug}/tasks/${task.id}`)}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 space-y-3.5 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/5 group"
                >
                  {/* Top Bar: Select + ID + Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => handleToggleSelect(task.id)}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        #{task.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {renderPriorityBadge(task.priority)}
                      {renderStatusBadge(task.status)}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Context: Department & Project */}
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-400">
                    <span className="inline-flex items-center gap-1.5 bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300">
                      <Building className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate max-w-[120px]">{task.department_name}</span>
                    </span>
                    {task.project_name && (
                      <span className="inline-flex items-center gap-1.5 bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{task.project_name}</span>
                      </span>
                    )}
                  </div>

                  {/* Footer: Assignee, Due Date & Actions */}
                  <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-indigo-500/30">
                        {task.assignee_name.slice(0, 1)}
                      </div>
                      <span className="text-xs text-zinc-300 truncate font-medium">{task.assignee_name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderDateBadge(task.due_date)}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/c/${companySlug}/tasks/${task.id}`}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                          title="View deliverable"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setTaskToDelete(task)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination for Cards View */}
          {totalPages > 1 && (
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs text-zinc-400">
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
      )}

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
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-indigo-500 cursor-pointer"
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
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-indigo-500 cursor-pointer"
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

      {/* Floating Bulk Action Bar */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/95 border border-indigo-500/40 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2 font-bold text-white">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-[11px] flex items-center justify-center font-mono">
              {selectedTaskIds.length}
            </span>
            <span>task{selectedTaskIds.length > 1 ? 's' : ''} selected</span>
          </div>

          <div className="h-4 w-px bg-zinc-700" />

          <button
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold inline-flex items-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>

          <button
            onClick={() => setSelectedTaskIds([])}
            className="text-zinc-400 hover:text-white font-medium cursor-pointer transition-colors"
          >
            Deselect All
          </button>
        </div>
      )}

      {/* Individual Task Delete Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white">Delete Deliverable Task?</h3>
                <p className="text-xs text-zinc-400 truncate">#{taskToDelete.id.slice(0, 8)} • {taskToDelete.title}</p>
              </div>
              <button
                onClick={() => setTaskToDelete(null)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">"{taskToDelete.title}"</strong>? All associated attachments, reviews, comments, and activities will be removed. This action cannot be undone.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteIndividual(taskToDelete)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Tasks Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white">Clear All Tasks?</h3>
                <p className="text-xs text-red-400/90 font-medium">Danger: Irreversible action</p>
              </div>
              <button
                onClick={() => {
                  setIsClearAllModalOpen(false);
                  setDeleteConfirmationText('');
                }}
                className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This will permanently delete <strong className="text-white">all {totalTasks} deliverables</strong> in this company workspace, including all their attachments, comments, reviewer records, and chat channels.
            </p>

            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <label className="text-[11px] font-semibold text-zinc-400 block">
                Type <span className="font-mono text-red-400 font-bold">CLEAR</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="CLEAR"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsClearAllModalOpen(false);
                  setDeleteConfirmationText('');
                }}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllTasks}
                disabled={isDeleting || deleteConfirmationText.trim().toUpperCase() !== 'CLEAR'}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing All...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Clear All Tasks</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
