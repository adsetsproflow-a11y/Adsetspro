'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  X,
  Mail,
  User,
  Calendar,
  Shield,
  Layers,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SuperAdminCompaniesPage() {
  const supabase = createClient();
  const [companies, setCompanies] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Modals
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState<any | null>(null);
  const [rejectingCompany, setRejectingCompany] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const q = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await fetch(`/api/super-admin/companies${q}`);
      const data = await res.json();

      if (data.success) {
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [filterStatus]);

  const executeAction = async (companyId: string, action: 'approve' | 'suspend' | 'reactivate') => {
    setActionLoadingId(companyId);
    try {
      const res = await fetch(`/api/super-admin/companies/${companyId}/${action}`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchCompanies();
      } else {
        const data = await res.json();
        alert(data.error || 'Action execution failed.');
      }
    } catch (err) {
      console.error('Error executing company action:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingCompany) return;
    if (!rejectReason.trim()) {
      setRejectError('Please enter a reason for rejecting this workspace application.');
      return;
    }

    setActionLoadingId(rejectingCompany.id);
    setRejectError(null);

    try {
      const res = await fetch(`/api/super-admin/companies/${rejectingCompany.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });

      if (res.ok) {
        setRejectingCompany(null);
        setRejectReason('');
        fetchCompanies();
      } else {
        const data = await res.json();
        setRejectError(data.error || 'Rejection failed.');
      }
    } catch (err: any) {
      setRejectError(err.message || 'Network error.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const query = searchQuery.toLowerCase();
    const adminEmail = (c.created_by_profile as any)?.email?.toLowerCase() || '';
    const adminName = (c.created_by_profile as any)?.full_name?.toLowerCase() || '';
    return (
      c.name.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query) ||
      adminEmail.includes(query) ||
      adminName.includes(query)
    );
  });

  const totalPages = Math.ceil(filteredCompanies.length / pageSize) || 1;
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Building2 className="w-3 h-3" />
              Tenant Directory
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Companies Management</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Authoritative registry of all enterprise workspaces, operational status, and tenant oversight
          </p>
        </div>
        <button
          onClick={fetchCompanies}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search organizations by name, workspace slug, or admin email..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-red-500"
          >
            <option value="all">All Statuses ({companies.length})</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Organization Name</th>
                <th className="py-3.5 px-4">Workspace Slug</th>
                <th className="py-3.5 px-4">Admin Email</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No companies found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((c) => {
                  const adminEmail = (c.created_by_profile as any)?.email || 'None';
                  const adminName = (c.created_by_profile as any)?.full_name || 'Admin';
                  const isActionLoading = actionLoadingId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200 font-bold shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-zinc-100 block truncate">
                              {c.name}
                            </span>
                            {c.reject_reason && (
                              <span className="text-[10px] text-red-400 block truncate max-w-xs">
                                Declination: {c.reject_reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3.5 px-4 font-mono text-zinc-400">/c/{c.slug}</td>

                      {/* Admin Email */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono text-zinc-200 text-[11px] block">
                            {adminEmail}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">{adminName}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            c.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : c.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : c.status === 'suspended'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Created date */}
                      <td className="py-3.5 px-4 text-zinc-400">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {c.status !== 'approved' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => executeAction(c.id, 'approve')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 font-semibold text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Approve
                            </button>
                          )}

                          {c.status === 'pending' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => {
                                setRejectingCompany(c);
                                setRejectReason('');
                                setRejectError(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 font-semibold text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Reject
                            </button>
                          )}

                          {c.status === 'approved' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => executeAction(c.id, 'suspend')}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 font-semibold text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}

                          {c.status === 'suspended' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => executeAction(c.id, 'reactivate')}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 font-semibold text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Reactivate
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedCompanyDetails(c)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href={`/c/${c.slug}/dashboard`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white transition-colors"
                            title="Open Tenant Workspace"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-zinc-950/60 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredCompanies.length)} of {filteredCompanies.length}{' '}
              organizations
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-xs text-zinc-200">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reject Organization Application</h3>
                  <p className="text-xs text-zinc-400">
                    Company: <span className="text-zinc-200 font-semibold">{rejectingCompany.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectingCompany(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">
                Reason for Rejection <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Specify rejection details (e.g., Unverified business entity, failed compliance review)..."
                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 resize-none"
              />
              {rejectError && <p className="text-xs text-red-400">{rejectError}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingCompany(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === rejectingCompany.id}
                onClick={handleConfirmReject}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {actionLoadingId === rejectingCompany.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedCompanyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedCompanyDetails.name}</h3>
                  <span className="text-xs text-zinc-400 font-mono">
                    /c/{selectedCompanyDetails.slug}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompanyDetails(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Status
                </span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedCompanyDetails.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : selectedCompanyDetails.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}
                >
                  {selectedCompanyDetails.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Company ID
                </span>
                <span className="font-mono text-zinc-300 text-[11px] block truncate">
                  {selectedCompanyDetails.id}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Primary Contact / Admin
                </span>
                <span className="font-semibold text-zinc-200 block">
                  {selectedCompanyDetails.created_by_profile?.full_name || 'Not available'}
                </span>
                <span className="font-mono text-zinc-400 text-[11px] block">
                  {selectedCompanyDetails.created_by_profile?.email || 'N/A'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Created At
                </span>
                <span className="text-zinc-200 block">
                  {new Date(selectedCompanyDetails.created_at).toLocaleString()}
                </span>
              </div>

              {selectedCompanyDetails.approved_at && (
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                    Approved At
                  </span>
                  <span className="text-emerald-400 block">
                    {new Date(selectedCompanyDetails.approved_at).toLocaleString()}
                  </span>
                </div>
              )}

              {selectedCompanyDetails.rejected_at && (
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                    Rejected At
                  </span>
                  <span className="text-red-400 block">
                    {new Date(selectedCompanyDetails.rejected_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {selectedCompanyDetails.reject_reason && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs space-y-1">
                <span className="font-bold text-red-400 block">Recorded Rejection Reason</span>
                <p className="text-zinc-300">{selectedCompanyDetails.reject_reason}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/c/${selectedCompanyDetails.slug}/dashboard`}
                target="_blank"
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-200 inline-flex items-center gap-2 transition-colors"
              >
                <span>Open Tenant Workspace</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedCompanyDetails(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
