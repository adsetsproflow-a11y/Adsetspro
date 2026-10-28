'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  CheckSquare,
  Activity,
  Building,
  AlertTriangle,
  RefreshCw,
  Archive,
  User,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dateFormat';
import CenterLoader from '@/components/common/CenterLoader';

interface ProjectDetailData {
  project: {
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    start_date: string | null;
    due_date: string | null;
    created_at: string;
    progress: number;
    total_tasks: number;
    approved_tasks: number;
    department?: { id: string; name: string } | null;
    manager?: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
    creator?: { id: string; full_name: string } | null;
  };
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    created_at: string;
    department_name: string;
    assignee_name: string;
  }[];
  members: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    is_manager: boolean;
    task_count: number;
  }[];
  activities: {
    id: string;
    action: string;
    target_type: string;
    details: any;
    created_at: string;
    actor?: { full_name: string } | null;
  }[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const projectId = params.projectId as string;

  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'members' | 'activity'>('tasks');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/projects/${projectId}`);
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to load project details');
      setData(resData);
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError(err.message || 'Error loading project');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug && projectId) {
      fetchProjectData();
    }
  }, [companySlug, projectId]);

  const handleArchiveProject = async () => {
    if (!window.confirm('Are you sure you want to archive this project?')) return;
    try {
      const res = await fetch(`/api/companies/${companySlug}/projects/${projectId}`, {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to archive project');
      router.push(`/c/${companySlug}/projects`);
    } catch (err: any) {
      alert(err.message || 'Error archiving project');
    }
  };

  if (isLoading) {
    return <CenterLoader message="Loading project details & milestone analytics..." />;
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Project Not Found</h3>
        <p className="text-xs text-zinc-400">{error || 'Requested project portfolio was not found.'}</p>
        <Link
          href={`/c/${companySlug}/projects`}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  const { project, tasks, members, activities } = data;

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

  const getTaskStatusBadgeStyle = (st: string) => {
    switch (st) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'submitted_for_review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'in_progress':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'blocked':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-2">
        <Link
          href={`/c/${companySlug}/projects`}
          className="text-xs text-zinc-400 hover:text-indigo-400 inline-flex items-center gap-1.5 transition-colors mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects Portfolios</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white">{project.name}</h1>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                  project.status
                )}`}
              >
                {project.status.replace(/_/g, ' ')}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityBadgeStyle(
                  project.priority
                )}`}
              >
                {project.priority} Priority
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">
              {project.description || 'No project description provided.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleArchiveProject}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:text-red-400 text-zinc-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Project Overview Card with Real Progress */}
      <div className="p-6 sm:p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-2xl space-y-6">
        {/* Progress bar container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Real Progress (Approved / Non-Cancelled Tasks)</span>
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {project.progress}% ({project.approved_tasks} of {project.total_tasks} Tasks Approved)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                project.progress === 100
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20'
                  : project.progress > 50
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Project Meta grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2 border-t border-zinc-800/60">
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Department
            </span>
            <span className="font-bold text-zinc-200 block truncate">
              {project.department?.name || 'General / Unassigned'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Project Manager
            </span>
            <span className="font-bold text-zinc-200 block truncate">
              {project.manager?.full_name || 'Unassigned'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <span>Start Date</span>
              <span className="text-[9px] font-mono text-zinc-600 font-normal">DD/MM/YYYY</span>
            </div>
            <span className="font-mono text-xs text-zinc-300 block">
              {project.start_date ? formatDate(project.start_date, 'short') : 'Immediate'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <span>Target Deadline</span>
              <span className="text-[9px] font-mono text-zinc-600 font-normal">DD/MM/YYYY</span>
            </div>
            <span className="font-mono text-xs text-zinc-300 block">
              {project.due_date ? formatDate(project.due_date, 'short') : 'Open-ended'}
            </span>
          </div>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div className="space-y-5">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tab 1 — Tasks ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'members'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tab 2 — Members ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Tab 3 — Activity ({activities.length})</span>
          </button>
        </div>

        {/* TAB 1: Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Project Deliverable Units</h3>
              <Link
                href={`/c/${companySlug}/tasks`}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Open Full Task Board →
              </Link>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Task Name</th>
                      <th className="py-3.5 px-4">Assignee</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-zinc-500">
                          No tasks have been associated with this project portfolio yet.
                        </td>
                      </tr>
                    ) : (
                      tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-zinc-100">{task.title}</td>
                          <td className="py-3.5 px-4 text-zinc-300 align-middle whitespace-nowrap">{task.assignee_name}</td>
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap leading-none ${getPriorityBadgeStyle(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap leading-none ${getTaskStatusBadgeStyle(
                                task.status
                              )}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.status === 'in_progress' ? 'bg-sky-400 animate-pulse' : 'bg-current'}`} />
                              <span>{task.status.replace(/_/g, ' ')}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                            {task.due_date ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-850/80 border border-zinc-700/60 text-zinc-200 text-xs font-mono font-medium">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>{formatDate(task.due_date, 'short')}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-850/60 border border-zinc-800 text-zinc-400 text-xs italic">
                                <Calendar className="w-3 h-3 text-zinc-500 shrink-0" />
                                No deadline
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Members */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Project Working Group</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.length === 0 ? (
                <p className="text-xs text-zinc-500 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 col-span-3 text-center">
                  No members are currently assigned to tasks within this project.
                </p>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-zinc-200 text-sm shrink-0">
                        {m.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{m.full_name}</h4>
                          {m.is_manager && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              Lead
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono truncate">{m.email}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-white block">{m.task_count}</span>
                      <span className="text-[10px] text-zinc-500">Assigned Tasks</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Activity */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Project Event Stream & Decision History</h3>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 divide-y divide-zinc-800/60 shadow-xl">
              {activities.length === 0 ? (
                <p className="text-xs text-zinc-500 py-8 text-center">No audit trail entries recorded yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-200">
                        {act.actor?.full_name || 'System Operator'}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(act.created_at).toLocaleString()}
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
        )}
      </div>
    </div>
  );
}
