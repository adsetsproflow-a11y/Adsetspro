'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building,
  Users,
  UserPlus,
  ArrowLeft,
  Crown,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Shield,
  Layers,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dateFormat';

interface DepartmentDetailData {
  department: {
    id: string;
    name: string;
    description: string;
    status: string;
    created_at: string;
    head_user_id: string | null;
    head: {
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
      phone: string | null;
    } | null;
  };
  members: {
    id: string;
    status: string;
    created_at: string;
    user: {
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
    };
    designation: {
      id: string;
      name: string;
    } | null;
    manager: {
      id: string;
      full_name: string;
    } | null;
  }[];
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    created_at: string;
  }[];
  task_summary: {
    total: number;
    in_progress: number;
    submitted_for_review: number;
    approved: number;
  };
}

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const departmentId = params.departmentId as string;

  const [data, setData] = useState<DepartmentDetailData | null>(null);
  const [companyEmployees, setCompanyEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isHeadModalOpen, setIsHeadModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedHeadId, setSelectedHeadId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberDesignation, setMemberDesignation] = useState('');
  const [memberReportingTo, setMemberReportingTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepartmentData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [deptRes, empRes] = await Promise.all([
        fetch(`/api/companies/${companySlug}/departments/${departmentId}`),
        fetch(`/api/companies/${companySlug}/employees`),
      ]);

      const deptData = await deptRes.json();
      const empData = await empRes.json();

      if (!deptRes.ok) throw new Error(deptData.error || 'Failed to fetch department');
      setData(deptData);
      setCompanyEmployees(empData.employees || []);
    } catch (err: any) {
      console.error('Failed to load department detail:', err);
      setError(err.message || 'Error loading department data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug && departmentId) {
      fetchDepartmentData();
    }
  }, [companySlug, departmentId]);

  const handleChangeHead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/companies/${companySlug}/departments/${departmentId}/head`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ head_user_id: selectedHeadId || null }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update department head');
      setIsHeadModalOpen(false);
      fetchDepartmentData();
    } catch (err: any) {
      alert(err.message || 'Error changing head');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/companies/${companySlug}/departments/${departmentId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedMemberId,
          reporting_to: memberReportingTo || undefined,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to add member');

      setIsMemberModalOpen(false);
      setSelectedMemberId('');
      setMemberReportingTo('');
      fetchDepartmentData();
    } catch (err: any) {
      alert(err.message || 'Error adding member');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-zinc-500 flex items-center justify-center gap-2 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
        <span>Loading department workspace details...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Department Not Found</h3>
        <p className="text-xs text-zinc-400">{error || 'Requested division does not exist.'}</p>
        <Link
          href={`/c/${companySlug}/departments`}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Departments</span>
        </Link>
      </div>
    );
  }

  const dept = data.department;
  const summary = data.task_summary;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/c/${companySlug}/departments`}
            className="text-xs text-zinc-400 hover:text-indigo-400 inline-flex items-center gap-1.5 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Departments Directory</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white">{dept.name}</h1>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                dept.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {dept.status}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            {dept.description || 'No division description provided.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/c/${companySlug}/departments/${departmentId}/analytics`}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs inline-flex items-center gap-2 transition-all shadow-md"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Department Analytics</span>
          </Link>
          <button
            onClick={() => setIsMemberModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Row 1: Head Card & Tasks Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Head Card */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Department Head</span>
            </h2>
            <button
              onClick={() => {
                setSelectedHeadId(dept.head_user_id || '');
                setIsHeadModalOpen(true);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              Change Head →
            </button>
          </div>

          {dept.head ? (
            <div className="flex items-center gap-3.5 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
                {dept.head.full_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{dept.head.full_name}</h3>
                <p className="text-xs text-zinc-400 font-mono truncate">{dept.head.email}</p>
                <span className="text-[10px] text-amber-400/90 font-semibold block pt-0.5">
                  Authorized Sign-Off Officer
                </span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center space-y-2">
              <p className="text-xs text-zinc-500">No leadership head currently assigned.</p>
              <button
                onClick={() => setIsHeadModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
              >
                Assign Department Head
              </button>
            </div>
          )}
        </div>

        {/* Department Tasks Summary Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <span className="text-xs text-zinc-400 font-semibold block">Total Tasks</span>
            <p className="text-2xl font-black text-white">{summary.total}</p>
            <span className="text-[10px] text-zinc-500">Division workload</span>
          </div>
          <div className="p-5 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-2">
            <span className="text-xs text-sky-300 font-semibold block">In Progress</span>
            <p className="text-2xl font-black text-sky-400">{summary.in_progress}</p>
            <span className="text-[10px] text-sky-300/80">Active tickets</span>
          </div>
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <span className="text-xs text-amber-300 font-semibold block">Under Review</span>
            <p className="text-2xl font-black text-amber-400">{summary.submitted_for_review}</p>
            <span className="text-[10px] text-amber-300/80">Pending review</span>
          </div>
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <span className="text-xs text-emerald-300 font-semibold block">Approved</span>
            <p className="text-2xl font-black text-emerald-400">{summary.approved}</p>
            <span className="text-[10px] text-emerald-300/80">Completed</span>
          </div>
        </div>
      </div>

      {/* Row 2: Members Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Department Members ({data.members.length})</span>
          </h2>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Reporting To</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Joined Date (DD/MM/YYYY)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {data.members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-zinc-500">
                      No members assigned to this department yet. Click "Add Member" above.
                    </td>
                  </tr>
                ) : (
                  data.members.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => router.push(`/c/${companySlug}/employees/${m.user.id}`)}
                      className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold text-zinc-200">
                            {m.user.full_name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-100 block">{m.user.full_name}</span>
                            <span className="text-[11px] text-zinc-500 font-mono block">{m.user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300">
                        {m.designation?.name || 'Department Staff'}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400">
                        {m.manager?.full_name || 'Self / Department Head'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            m.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-zinc-400 font-mono">
                        {formatDate(m.created_at, 'short')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Change Head Modal */}
      {isHeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Change Department Head</h3>
                  <p className="text-xs text-zinc-400">Assign leadership authority for {dept.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsHeadModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangeHead} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Select Employee / Leader
                </label>
                <select
                  value={selectedHeadId}
                  onChange={(e) => setSelectedHeadId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- None (Unassigned) --</option>
                  {companyEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.email}) - {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHeadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Save Department Head'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Add Department Member</h3>
                  <p className="text-xs text-zinc-400">Map an active employee to {dept.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Select Employee <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Employee --</option>
                  {companyEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Reporting Manager</label>
                <select
                  value={memberReportingTo}
                  onChange={(e) => setMemberReportingTo(e.target.value)}
                  className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Direct to Department Head --</option>
                  {companyEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add to Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
