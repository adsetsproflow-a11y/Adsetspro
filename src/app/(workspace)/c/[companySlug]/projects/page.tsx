'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Calendar,
  Clock,
  RefreshCw,
  X,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Building,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dateFormat';

interface ProjectCardData {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  department_name: string;
  department_id: string | null;
  manager_name: string;
  manager_email: string | null;
  progress: number;
  total_tasks: number;
  approved_tasks: number;
}

export default function ProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;

  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deptId, setDeptId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');

  const fetchProjectsAndOptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qParams = new URLSearchParams();
      if (statusFilter !== 'all') qParams.set('status', statusFilter);
      if (priorityFilter !== 'all') qParams.set('priority', priorityFilter);
      if (departmentFilter !== 'all') qParams.set('department_id', departmentFilter);
      if (startDateFilter) qParams.set('startDate', startDateFilter);
      if (endDateFilter) qParams.set('endDate', endDateFilter);
      if (searchQuery.trim()) qParams.set('search', searchQuery.trim());

      const [projRes, deptRes, empRes] = await Promise.all([
        fetch(`/api/companies/${companySlug}/projects?${qParams.toString()}`),
        fetch(`/api/companies/${companySlug}/departments`),
        fetch(`/api/companies/${companySlug}/employees`),
      ]);

      const projData = await projRes.json();
      const deptData = await deptRes.json();
      const empData = await empRes.json();

      if (!projRes.ok) throw new Error(projData.error || 'Failed to load projects');

      setProjects(projData.projects || []);
      setDepartments(deptData.departments || []);
      setEmployees(empData.employees || []);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError(err.message || 'Error loading projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      fetchProjectsAndOptions();
    }
  }, [companySlug, statusFilter, priorityFilter, departmentFilter, startDateFilter, endDateFilter]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/companies/${companySlug}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          department_id: deptId || undefined,
          manager_id: managerId || undefined,
          start_date: startDate || undefined,
          due_date: dueDate || undefined,
          priority,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');

      setIsModalOpen(false);
      setName('');
      setDescription('');
      setDeptId('');
      setManagerId('');
      setStartDate('');
      setDueDate('');
      setPriority('medium');
      fetchProjectsAndOptions();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
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
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'completed':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'on_hold':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Briefcase className="w-3 h-3" />
              Strategic Initiatives
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Project Portfolios</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Multi-department deliverable groups, milestone track records, and operational completion rates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProjectsAndOptions}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setError(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProjectsAndOptions()}
              placeholder="Search projects by title, manager, or description..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Department */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-400">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase">Start Date:</span>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="py-1 px-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200"
          />
          <span className="text-[11px] font-semibold text-zinc-500 uppercase">Deadline Before:</span>
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="py-1 px-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200"
          />
          {(startDateFilter || endDateFilter || statusFilter !== 'all' || priorityFilter !== 'all' || departmentFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStartDateFilter('');
                setEndDateFilter('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setDepartmentFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-zinc-800/80 rounded w-24" />
                <div className="h-4 bg-zinc-800/80 rounded w-16" />
              </div>
              <div className="h-5 bg-zinc-800/80 rounded w-48" />
              <div className="h-10 bg-zinc-800/40 rounded w-full" />
              <div className="h-2 bg-zinc-800/60 rounded-full w-full" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
          <Briefcase className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No projects — Start a new project</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Establish new initiative portfolios to organize tasks, assign project leads, and track deliverable milestones.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start a New Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/c/${companySlug}/projects/${project.id}`)}
              className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-indigo-500/40 hover:bg-zinc-900/80 transition-all cursor-pointer flex flex-col justify-between group space-y-5 shadow-xl"
            >
              <div className="space-y-3.5">
                {/* Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-cyan-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>{project.department_name}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityBadgeStyle(
                        project.priority
                      )}`}
                    >
                      {project.priority}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                        project.status
                      )}`}
                    >
                      {project.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Title & Desc */}
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                    {project.description || 'No detailed scope description provided.'}
                  </p>
                </div>
              </div>

              {/* Progress & Details */}
              <div className="space-y-3 pt-3 border-t border-zinc-800/60">
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[11px]">Milestone Completion</span>
                    <span className="font-mono font-bold text-white text-[11px]">
                      {project.progress}% ({project.approved_tasks}/{project.total_tasks})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        project.progress === 100
                          ? 'bg-emerald-500'
                          : project.progress > 50
                          ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Due date & Manager */}
                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[11px] font-mono">
                      {project.due_date ? formatDate(project.due_date, 'short') : 'No deadline'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[11px] text-zinc-300 font-medium truncate max-w-[120px]">
                      {project.manager_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Project</h3>
                  <p className="text-xs text-zinc-400">Establish a deliverable initiative portfolio</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. NextGen Web Experience 2026"
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Scope, objectives, and deliverable targets..."
                  className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Department</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- General / No Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Project Manager</label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Project Manager --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
