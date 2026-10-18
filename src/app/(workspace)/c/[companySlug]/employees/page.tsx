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
  MoreVertical,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/employees`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch employees');

      const emps: EmployeeItem[] = data.employees || [];
      setEmployees(emps);

      // Collect distinct department names
      const depts = Array.from(new Set(emps.map((e) => e.department_name))).filter(Boolean);
      setDepartments(depts);
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
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

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
            onClick={fetchEmployees}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh employees"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href={`/c/${companySlug}/invitations`}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Employee</span>
          </Link>
        </div>
      </div>

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
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/c/${companySlug}/employees/${emp.id}/performance`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                          title="View Performance Analytics"
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>Performance</span>
                        </Link>
                        <Link
                          href={`/c/${companySlug}/employees/${emp.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-indigo-600/20 text-zinc-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
                          title="View Employee Profile"
                        >
                          <span className="text-[11px] font-semibold">Profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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
    </div>
  );
}
