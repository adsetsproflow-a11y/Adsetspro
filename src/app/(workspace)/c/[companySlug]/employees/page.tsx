'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Shield,
  RefreshCw,
  ChevronRight,
  Building,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MoreVertical,
  ExternalLink,
  TrendingUp,
  Trash2,
  UserX,
  UserCheck,
} from 'lucide-react';
import CenterLoader from '@/components/common/CenterLoader';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/cache/clientCache';

interface EmployeeItem {
  id: string;
  membership_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  account_status: string;
  role: 'COMPANY_ADMIN' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';
  status: string;
  department_name: string;
  designation_name: string;
  joined_at: string;
}

export default function EmployeesPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [quota, setQuota] = useState<{
    memberLimit: number;
    activeMembersCount: number;
    pendingInvitesCount: number;
    usedSeats: number;
    availableSeats: number;
    isLimitReached: boolean;
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('EMPLOYEE');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async (force = false) => {
    const cacheKey = `employees_${companySlug}`;
    if (!force) {
      const cached = getCachedData<any>(cacheKey);
      if (cached) {
        setEmployees(cached.employees || []);
        if (cached.currentUserId) setCurrentUserId(cached.currentUserId);
        if (cached.currentUserRole) setCurrentUserRole(cached.currentUserRole);
        if (cached.departments) setDepartments(cached.departments);
        if (cached.quota) setQuota(cached.quota);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    } else {
      setIsLoading(true);
    }

    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/employees`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch employees');

      const emps: EmployeeItem[] = data.employees || [];
      const depts = Array.from(new Set(emps.map((e) => e.department_name))).filter(Boolean);

      setEmployees(emps);
      if (data.currentUserId) setCurrentUserId(data.currentUserId);
      if (data.currentUserRole) setCurrentUserRole(data.currentUserRole);
      setDepartments(depts);
      if (data.quota) setQuota(data.quota);

      setCachedData(cacheKey, {
        employees: emps,
        currentUserId: data.currentUserId,
        currentUserRole: data.currentUserRole,
        departments: depts,
        quota: data.quota || null,
      });
    } catch (err: any) {
      console.error('Failed to load employees:', err);
      setError(err.message || 'Error loading employees');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      fetchEmployees();
    }
  }, [companySlug]);

  const canDeleteEmployee = (emp: EmployeeItem) => {
    // Cannot delete yourself
    if (emp.id === currentUserId) return false;
    // Super Admin / Company Admin can delete anyone except self
    if (currentUserRole === 'COMPANY_ADMIN') return true;
    // Department Head can only delete team employees
    if (currentUserRole === 'DEPARTMENT_HEAD' && emp.role === 'EMPLOYEE') return true;
    return false;
  };

  const canToggleStatus = (emp: EmployeeItem) => {
    if (emp.id === currentUserId) return false;
    if (currentUserRole === 'COMPANY_ADMIN') return true;
    if (currentUserRole === 'DEPARTMENT_HEAD' && emp.role === 'EMPLOYEE') return true;
    return false;
  };

  const handleToggleStatus = async (e: React.MouseEvent, emp: EmployeeItem) => {
    e.stopPropagation();
    const newStatus = emp.status === 'active' ? 'deactivated' : 'active';
    const actionLabel = newStatus === 'active' ? 'activate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${actionLabel} "${emp.full_name}"?`)) {
      return;
    }

    setTogglingStatusId(emp.id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/employees/${emp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${actionLabel} employee`);

      setActionMessage({
        type: 'success',
        text: `Status for "${emp.full_name}" successfully updated to ${newStatus}.`,
      });
      fetchEmployees();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to update employee status',
      });
    } finally {
      setTogglingStatusId(null);
    }
  };

  const handleDeleteEmployee = async (e: React.MouseEvent, emp: EmployeeItem) => {
    e.stopPropagation();

    if (
      !window.confirm(
        `⚠️ Are you sure you want to PERMANENTLY DELETE employee "${emp.full_name}" (${emp.email})?\n\nThis will completely purge all their company memberships, department assignments, task allocations, and platform access.\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(emp.id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/employees/${emp.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete employee');

      setActionMessage({
        type: 'success',
        text: data.message || `Employee "${emp.full_name}" permanently deleted.`,
      });
      fetchEmployees();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to delete employee',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      emp.full_name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.designation_name.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    const matchesDept = departmentFilter === 'all' || emp.department_name === departmentFilter;

    return matchesQuery && matchesRole && matchesStatus && matchesDept;
  });

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'COMPANY_ADMIN':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'DEPARTMENT_HEAD':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'suspended':
      case 'deactivated':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  if (isLoading && employees.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <CenterLoader
          message="Loading Employee Roster..."
          subtitle="Retrieving staff allocations, roles, and department assignments"
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Users className="w-3 h-3" />
              Talent Directory
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Employee Roster</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Organization members, department allocations, designations, and account access
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchEmployees(true)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh employees"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {(currentUserRole === 'COMPANY_ADMIN' || currentUserRole === 'SUPER_ADMIN') && (
            <Link
              href={`/c/${companySlug}/invitations`}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs inline-flex items-center gap-2 shadow-lg transition-all ${
                quota?.isLimitReached
                  ? 'bg-amber-600/25 hover:bg-amber-600/35 text-amber-300 border border-amber-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Employee {quota?.isLimitReached ? '(Seats Full)' : ''}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Seat Allocation Card for Admins */}
      {quota && (currentUserRole === 'COMPANY_ADMIN' || currentUserRole === 'SUPER_ADMIN') && (
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Member Capacity: {quota.usedSeats} / {quota.memberLimit} Seats Used
              </span>
              {quota.isLimitReached ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Capacity Reached (Full)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {quota.availableSeats} {quota.availableSeats === 1 ? 'seat' : 'seats'} available
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              {quota.activeMembersCount} active organization members • {quota.pendingInvitesCount} pending onboarding invitations
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-48 bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-500 ${
                  quota.isLimitReached
                    ? 'bg-amber-500'
                    : quota.usedSeats / quota.memberLimit > 0.7
                    ? 'bg-indigo-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (quota.usedSeats / quota.memberLimit) * 100)}%` }}
              />
            </div>
            {quota.isLimitReached && (
              <span className="text-[11px] text-amber-300 font-medium">
                Ask Super Admin to grant +5 seats pack
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action feedback toast / banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-zinc-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees by name, email, or designation..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="COMPANY_ADMIN">Company Admin</option>
            <option value="DEPARTMENT_HEAD">Department Head</option>
            <option value="EMPLOYEE">Employee</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 bg-zinc-800/80 rounded w-44" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-zinc-800/80 rounded w-28" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-zinc-800/80 rounded w-32" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-zinc-800/80 rounded w-24" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-zinc-800/80 rounded w-16" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 bg-zinc-800/80 rounded w-8 ml-auto" /></td>
                    </tr>
                  ))}
                </>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-zinc-500 space-y-3">
                    <Users className="w-10 h-10 mx-auto text-zinc-600" />
                    <div>
                      <p className="text-sm text-zinc-300 font-bold">
                        {employees.length === 0
                          ? 'No employees yet — Invite your first employee'
                          : 'No employees matching the current filter criteria.'}
                      </p>
                      <p className="text-xs text-zinc-500 pt-1">
                        {employees.length === 0
                          ? 'Send onboarding invitation links to bring team members into your workspace.'
                          : 'Try clearing your search query or role/status filters.'}
                      </p>
                    </div>
                    {employees.length === 0 && (
                      <Link
                        href={`/c/${companySlug}/invitations`}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Invite Employee</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => router.push(`/c/${companySlug}/employees/${emp.id}`)}
                    className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    {/* Avatar & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-indigo-300 shrink-0">
                          {emp.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-zinc-100 block truncate">
                            {emp.full_name}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono block truncate">
                            {emp.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <span className="text-zinc-300 font-medium">{emp.department_name}</span>
                    </td>

                    {/* Designation */}
                    <td className="py-3.5 px-4">
                      <span className="text-zinc-400">{emp.designation_name}</span>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(
                          emp.role
                        )}`}
                      >
                        {emp.role.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeStyle(
                          emp.status
                        )}`}
                      >
                        {emp.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                        <Link
                          href={`/c/${companySlug}/employees/${emp.id}/performance`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                          title="View Performance Analytics"
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span className="hidden sm:inline">Performance</span>
                        </Link>
                        <Link
                          href={`/c/${companySlug}/employees/${emp.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-indigo-600/20 text-zinc-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
                          title="View Employee Profile"
                        >
                          <span className="text-[11px] font-semibold hidden sm:inline">Profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>

                        {/* Deactivate / Reactivate button */}
                        {canToggleStatus(emp) && (
                          <button
                            onClick={(e) => handleToggleStatus(e, emp)}
                            disabled={togglingStatusId === emp.id}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all inline-flex items-center gap-1 cursor-pointer ${
                              emp.status === 'active'
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20 hover:border-amber-500/40'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40'
                            }`}
                            title={emp.status === 'active' ? 'Deactivate access' : 'Activate access'}
                          >
                            {togglingStatusId === emp.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : emp.status === 'active' ? (
                              <UserX className="w-3 h-3" />
                            ) : (
                              <UserCheck className="w-3 h-3" />
                            )}
                            <span>{emp.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                          </button>
                        )}

                        {/* Delete button (Prominent) */}
                        {canDeleteEmployee(emp) && (
                          <button
                            onClick={(e) => handleDeleteEmployee(e, emp)}
                            disabled={deletingId === emp.id}
                            className="px-2.5 py-1 rounded-lg bg-red-600/15 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 font-bold text-[11px] inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            title="Permanently Delete Employee"
                          >
                            {deletingId === emp.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>Delete</span>
                          </button>
                        )}

                        {emp.id === currentUserId && (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700/60 font-semibold">
                            You
                          </span>
                        )}
                      </div>
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
