'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  UserPlus,
  Mail,
  Clock,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Building,
  RotateCcw,
  Ban,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';

interface InvitationItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  department?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
  inviter?: { id: string; full_name: string } | null;
}

export default function InvitationsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedTokenUrl, setCopiedTokenUrl] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState<'EMPLOYEE' | 'DEPARTMENT_HEAD'>('EMPLOYEE');
  const [reportingTo, setReportingTo] = useState('');

  // Feedback State
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    inviteUrl?: string;
  } | null>(null);

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const [invRes, deptRes, empRes] = await Promise.all([
        fetch(`/api/companies/${companySlug}/invitations`),
        fetch(`/api/companies/${companySlug}/departments`),
        fetch(`/api/companies/${companySlug}/employees`),
      ]);

      if (invRes.status === 403) {
        setIsForbidden(true);
        setIsLoading(false);
        return;
      }

      const invData = await invRes.json();
      const deptData = await deptRes.json();
      const empData = await empRes.json();

      setInvitations(invData.invitations || []);
      setDepartments(deptData.departments || []);
      setEmployees(empData.employees || []);
    } catch (err: any) {
      console.error('Failed to load invitations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      fetchInvitations();
    }
  }, [companySlug]);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/companies/${companySlug}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          department_id: departmentId || undefined,
          role,
          reporting_to: reportingTo || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invitation');

      setFeedback({
        type: 'success',
        text: `Invitation link generated for ${email}. Valid for 7 days.`,
        inviteUrl: data.inviteUrl,
      });

      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setDepartmentId('');
      setRole('EMPLOYEE');
      setReportingTo('');
      fetchInvitations();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error issuing invitation',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeInvitation = async (invId: string) => {
    if (!window.confirm('Are you sure you want to revoke this invitation?')) return;

    setActionLoadingId(invId);
    try {
      const res = await fetch(`/api/companies/${companySlug}/invitations/${invId}/revoke`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke invitation');

      setFeedback({
        type: 'success',
        text: 'Invitation has been revoked successfully.',
      });
      fetchInvitations();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error revoking invitation',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResendInvitation = async (invId: string) => {
    setActionLoadingId(invId);
    try {
      const res = await fetch(`/api/companies/${companySlug}/invitations/${invId}/resend`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend invitation');

      setFeedback({
        type: 'success',
        text: 'Invitation has been renewed with a fresh 7-day token.',
        inviteUrl: data.inviteUrl,
      });
      fetchInvitations();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error resending invitation',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedTokenUrl(url);
    setTimeout(() => setCopiedTokenUrl(null), 2500);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'revoked':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  if (isForbidden) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
          <Shield className="w-8 h-8" />
        </div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          403 Forbidden
        </span>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Employee onboarding invitations and management are restricted to Workspace Administrators and Department Heads.
        </p>
        <Link
          href={`/c/${companySlug}/my-tasks`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
        >
          <span>Return to My Tasks</span>
        </Link>
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
              <UserPlus className="w-3 h-3" />
              Onboarding Pipeline
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Employee Invitations</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Issue cryptographically secure tokens to onboard staff members into their designated roles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInvitations}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setFeedback(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Employee</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.text}</span>
          </div>

          {feedback.inviteUrl && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copyToClipboard(feedback.inviteUrl!)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedTokenUrl === feedback.inviteUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Onboarding URL</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invitations Table */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Invited Member</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Sent Date</th>
                <th className="py-3.5 px-4">Expires</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No active or historical invitations issued yet.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => {
                  const isActionLoading = actionLoadingId === inv.id;
                  const isExpired = new Date(inv.expires_at) < new Date();
                  const effectiveStatus = isExpired && inv.status === 'pending' ? 'expired' : inv.status;

                  return (
                    <tr key={inv.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-zinc-100 block">{inv.full_name}</span>
                          <span className="text-[11px] text-zinc-400 font-mono block">{inv.email}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-zinc-300">
                        {inv.department?.name || 'General / Unassigned'}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300">
                          {inv.role.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeStyle(
                            effectiveStatus
                          )}`}
                        >
                          {effectiveStatus}
                        </span>
                      </td>

                      {/* Sent Date */}
                      <td className="py-3.5 px-4 text-zinc-400">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>

                      {/* Expires */}
                      <td className="py-3.5 px-4 text-zinc-400 font-mono">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {inv.status === 'pending' && (
                            <>
                              <button
                                disabled={isActionLoading}
                                onClick={() => handleResendInvitation(inv.id)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                                title="Renew and resend token"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Resend</span>
                              </button>
                              <button
                                disabled={isActionLoading}
                                onClick={() => handleRevokeInvitation(inv.id)}
                                className="px-2.5 py-1 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                                title="Revoke invitation"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Revoke</span>
                              </button>
                            </>
                          )}
                          {inv.status === 'revoked' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleResendInvitation(inv.id)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Re-invite
                            </button>
                          )}
                          {inv.status === 'accepted' && (
                            <span className="text-[11px] text-emerald-400 font-medium">Onboarded</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Invite New Team Member</h3>
                  <p className="text-xs text-zinc-400">Generate secure onboarding invitation</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Work Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@company.com"
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Target Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Unassigned / General --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Access Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="DEPARTMENT_HEAD">Department Head</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Reporting Manager</label>
                <select
                  value={reportingTo}
                  onChange={(e) => setReportingTo(e.target.value)}
                  className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- No Direct Manager --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.email})
                    </option>
                  ))}
                </select>
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
                  {isSubmitting ? 'Generating...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
