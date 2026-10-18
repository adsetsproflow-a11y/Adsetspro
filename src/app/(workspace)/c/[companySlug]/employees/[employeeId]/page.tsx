'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building,
  CheckSquare,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Award,
  Trash2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dateFormat';

interface EmployeeProfileData {
  currentUserId?: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    phone: string | null;
    account_status: string;
    role: string;
    membership_status: string;
    created_at: string;
    joined_at: string;
  };
  departments: {
    id: string;
    status: string;
    created_at: string;
    department: { id: string; name: string };
    designation: { id: string; name: string } | null;
    reporting_to_profile: { id: string; full_name: string; email: string } | null;
  }[];
  current_tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    department_name: string;
    project_name: string;
    assigned_at: string;
  }[];
  task_history: {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    is_current: boolean;
    completed_at: string | null;
  }[];
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const employeeId = params.employeeId as string;

  const [data, setData] = useState<EmployeeProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployeeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/employees/${employeeId}`);
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to fetch employee details');
      setData(resData);
    } catch (err: any) {
      console.error('Error fetching employee:', err);
      setError(err.message || 'Error loading employee profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug && employeeId) {
      fetchEmployeeData();
    }
  }, [companySlug, employeeId]);

  const handleUpdateStatus = async (newStatus: 'active' | 'suspended' | 'deactivated') => {
    if (!window.confirm(`Are you sure you want to change this member's status to "${newStatus}"?`)) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/companies/${companySlug}/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update member status');

      fetchEmployeeData();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!data?.profile) return;
    if (
      !window.confirm(
        `⚠️ Are you sure you want to PERMANENTLY DELETE "${data.profile.full_name}" (${data.profile.email})?\n\nThis will completely purge their organization membership, department assignments, task allocations, and platform access.\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/companies/${companySlug}/employees/${employeeId}`, {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to delete member');

      alert(resData.message || 'Employee permanently deleted');
      router.push(`/c/${companySlug}/employees`);
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-zinc-500 flex items-center justify-center gap-2 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
        <span>Loading member profile...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Member Not Found</h3>
        <p className="text-xs text-zinc-400">{error || 'Requested staff profile was not found.'}</p>
        <Link
          href={`/c/${companySlug}/employees`}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employees</span>
        </Link>
      </div>
    );
  }

  const { profile, departments, current_tasks, task_history } = data;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-1">
        <Link
          href={`/c/${companySlug}/employees`}
          className="text-xs text-zinc-400 hover:text-indigo-400 inline-flex items-center gap-1.5 transition-colors mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employee Roster</span>
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-white">Staff Member Profile</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Individual credentials, department associations, workload assignments, and account governance
        </p>
      </div>

      {/* Row 1: Profile Card with Status Management */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-zinc-800/60">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-2xl text-white shadow-xl shadow-indigo-500/20 shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {profile.role.replace(/_/g, ' ')}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    profile.membership_status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}
                >
                  {profile.membership_status}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">{profile.email}</p>
            </div>
          </div>

          {/* Account Status Management Actions */}
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            {profile.membership_status !== 'active' && (
              <button
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus('active')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reactivate Access</span>
              </button>
            )}

            {profile.membership_status === 'active' && (
              <button
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus('suspended')}
                className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Suspend Account</span>
              </button>
            )}

            {profile.membership_status !== 'deactivated' && (
              <button
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus('deactivated')}
                className="px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Deactivate</span>
              </button>
            )}

            {/* Permanent Delete Member Action */}
            {data.currentUserId !== profile.id && (
              <button
                disabled={isDeleting}
                onClick={handleDeleteEmployee}
                className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-red-500/10"
                title="Permanently Delete Member from Organization"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Member'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Contact Email
            </span>
            <div className="flex items-center gap-2 text-zinc-200 font-mono">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span>{profile.email}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Direct Phone
            </span>
            <div className="flex items-center gap-2 text-zinc-200 font-mono">
              <Phone className="w-3.5 h-3.5 text-zinc-400" />
              <span>{profile.phone || 'No phone provided'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Onboarding Date (DD/MM/YYYY)
            </span>
            <div className="flex items-center gap-2 text-zinc-200">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>{formatDate(profile.joined_at, 'short')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Department Memberships */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Building className="w-4 h-4 text-cyan-400" />
          <span>Department Allocations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.length === 0 ? (
            <p className="text-xs text-zinc-500 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              Member is not currently assigned to any organizational divisions.
            </p>
          ) : (
            departments.map((d) => (
              <div
                key={d.id}
                className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{d.department.name}</h4>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {d.status}
                  </span>
                </div>
                <div className="text-xs space-y-1 text-zinc-400">
                  <p>
                    Designation: <span className="text-zinc-200 font-medium">{d.designation?.name || 'Staff Member'}</span>
                  </p>
                  <p>
                    Reporting To:{' '}
                    <span className="text-zinc-200 font-medium">
                      {d.reporting_to_profile?.full_name || 'Department Head'}
                    </span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Row 3: Current Active Tasks */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-indigo-400" />
          <span>Active Assigned Tasks ({current_tasks.length})</span>
        </h3>

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Task Title</th>
                  <th className="py-3.5 px-4">Department / Project</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {current_tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No active tickets currently assigned to this member.
                    </td>
                  </tr>
                ) : (
                  current_tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-zinc-100">{task.title}</td>
                      <td className="py-3.5 px-4 text-zinc-400">
                        {task.department_name} • {task.project_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-zinc-400 font-mono">
                        {task.due_date ? formatDate(task.due_date, 'short') : 'No date'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 4: Task History */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Task History & Deliverable Track Record</span>
        </h3>

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Task Name</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Final Status</th>
                  <th className="py-3.5 px-4 text-right">Resolved Date (DD/MM/YYYY)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {task_history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">
                      No prior task history records found.
                    </td>
                  </tr>
                ) : (
                  task_history.map((h) => (
                    <tr key={h.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-zinc-200">{h.title}</td>
                      <td className="py-3.5 px-4 text-zinc-400 capitalize">{h.priority}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            h.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {h.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-zinc-400 font-mono">
                        {h.completed_at ? formatDate(h.completed_at, 'short') : 'Active'}
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
