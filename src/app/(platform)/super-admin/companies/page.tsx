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
  Phone,
  Calendar,
  Shield,
  Layers,
  Trash2,
  Plus,
  Minus,
  Sliders,
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
  const [modalCustomAmount, setModalCustomAmount] = useState<number>(5);
  const [seatAdjustCompany, setSeatAdjustCompany] = useState<any | null>(null);
  const [customSeatMode, setCustomSeatMode] = useState<'add' | 'remove'>('add');
  const [customSeatAmount, setCustomSeatAmount] = useState<number>(5);
  const [rejectingCompany, setRejectingCompany] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<any | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleAdjustSeats = async (
    companyId: string,
    companyName: string,
    requestedChange: number,
    currentLimit?: number,
    activeCount?: number,
    skipConfirm = false
  ) => {
    let increment = requestedChange;
    const curCap = typeof currentLimit === 'number' ? currentLimit : 5;
    const curActive = typeof activeCount === 'number' ? activeCount : 0;

    // Safety checks for reducing seats
    if (increment < 0) {
      if (curCap <= curActive) {
        alert(
          `Cannot reduce seats for "${companyName}": All ${curCap} seats are occupied by active members (${curActive}). To free up quota, remove or deactivate members first.`
        );
        return;
      }

      const target = curCap + increment;
      if (target < curActive) {
        const maxReduction = curCap - curActive;
        const confirmClamp = window.confirm(
          `Reducing by ${Math.abs(increment)} seats would drop capacity below active members (${curActive}).\n\nWould you like to reduce by ${maxReduction} seats instead to match current active usage (${curActive} seats)?`
        );
        if (!confirmClamp) return;
        increment = -maxReduction;
      } else if (!skipConfirm) {
        const confirmPrompt = window.confirm(
          `Reduce ${Math.abs(increment)} seats from organization "${companyName}"?\n\nCurrent Capacity: ${curCap} Seats\nNew Capacity: ${curCap + increment} Seats`
        );
        if (!confirmPrompt) return;
      }
    } else if (!skipConfirm) {
      const confirmPrompt = window.confirm(
        `Allocate +${increment} seats to organization "${companyName}"?\n\nCurrent Capacity: ${curCap} Seats\nNew Capacity: ${curCap + increment} Seats`
      );
      if (!confirmPrompt) return;
    }

    setActionLoadingId(companyId);
    try {
      const res = await fetch(`/api/super-admin/companies/${companyId}/add-seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ increment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to adjust seats');
      alert(data.message || `Successfully adjusted seats.`);
      await fetchCompanies();
      if (selectedCompanyDetails && selectedCompanyDetails.id === companyId) {
        setSelectedCompanyDetails((prev: any) => ({
          ...prev,
          member_limit: data.newLimit,
        }));
      }
      if (seatAdjustCompany && seatAdjustCompany.id === companyId) {
        setSeatAdjustCompany((prev: any) => ({
          ...prev,
          member_limit: data.newLimit,
        }));
      }
    } catch (err: any) {
      alert(err.message || 'Error adjusting seats');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddSeats = (companyId: string, companyName: string, increment = 5) => {
    return handleAdjustSeats(companyId, companyName, increment);
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

  const handleConfirmDelete = async () => {
    if (!deletingCompany) return;
    setActionLoadingId(deletingCompany.id);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/super-admin/companies/${deletingCompany.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        setDeletingCompany(null);
        fetchCompanies();
      } else {
        setDeleteError(data.error || 'Failed to delete company.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Network error.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const query = searchQuery.toLowerCase();
    const adminEmail = (c.created_by_profile as any)?.email?.toLowerCase() || c.registrant_email?.toLowerCase() || '';
    const adminName = (c.created_by_profile as any)?.full_name?.toLowerCase() || c.registrant_name?.toLowerCase() || '';
    const adminPhone = (c.created_by_profile as any)?.phone?.toLowerCase() || c.registrant_phone?.toLowerCase() || c.phone?.toLowerCase() || '';
    return (
      c.name.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query) ||
      adminEmail.includes(query) ||
      adminName.includes(query) ||
      adminPhone.includes(query)
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
                <th className="py-3.5 px-4 whitespace-nowrap">Organization Name</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Workspace Slug</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Admin Contact</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Seat Quota</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Created Date</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No companies found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((c) => {
                  const adminProfile = c.created_by_profile;
                  const adminEmail = (adminProfile as any)?.email || c.registrant_email || 'No email';
                  const adminName = (adminProfile as any)?.full_name || c.registrant_name || 'Admin';
                  const adminPhone = (adminProfile as any)?.phone || c.registrant_phone || c.phone || null;
                  const isActionLoading = actionLoadingId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-[140px]">
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
                      <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap">/c/{c.slug}</td>

                      {/* Admin Contact & Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="text-zinc-200 text-xs font-semibold block truncate max-w-[160px]">
                            {adminName}
                          </span>
                          <span className="font-mono text-zinc-400 text-[11px] block whitespace-nowrap">
                            {adminEmail}
                          </span>
                          {adminPhone ? (
                            <a
                              href={`tel:${adminPhone.replace(/\s+/g, '')}`}
                              className="font-mono text-emerald-400 hover:text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1 hover:underline"
                              title="Call applicant"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>{adminPhone}</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic block">No phone</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
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

                      {/* Seat Quota */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {(() => {
                          const active = Number(c.member_count || 0);
                          const pending = Number(c.pending_count || 0);
                          const used = active + pending;
                          const cap = Number(c.member_limit || 5);
                          const isFull = used >= cap;
                          const pct = Math.min(100, Math.round((used / cap) * 100));

                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-semibold font-mono text-[11px] ${
                                    isFull ? 'text-amber-400' : 'text-zinc-200'
                                  }`}
                                >
                                  {used} / {cap} Seats
                                </span>
                                {isFull && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    FULL
                                  </span>
                                )}
                              </div>
                              <div className="w-24 bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    isFull ? 'bg-amber-500' : 'bg-indigo-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-zinc-500 block">
                                {active} active • {pending} pending
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Created date */}
                      <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 flex-nowrap">
                          {c.status === 'approved' && (
                            <div className="inline-flex items-center gap-1">
                              <button
                                disabled={
                                  isActionLoading ||
                                  Number(c.member_limit || 5) <= Number(c.member_count || 0)
                                }
                                onClick={() =>
                                  handleAdjustSeats(
                                    c.id,
                                    c.name,
                                    -5,
                                    Number(c.member_limit || 5),
                                    Number(c.member_count || 0)
                                  )
                                }
                                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-semibold text-[11px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-0.5 shadow-sm whitespace-nowrap"
                                title={
                                  Number(c.member_limit || 5) <= Number(c.member_count || 0)
                                    ? `All ${c.member_limit || 5} seats are currently occupied (${c.member_count || 0} active members)`
                                    : `Reduce seats quota (Capacity: ${c.member_limit || 5}, Active: ${c.member_count || 0})`
                                }
                              >
                                <span>-5 Seats</span>
                              </button>
                              <button
                                disabled={isActionLoading}
                                onClick={() =>
                                  handleAdjustSeats(
                                    c.id,
                                    c.name,
                                    5,
                                    Number(c.member_limit || 5),
                                    Number(c.member_count || 0)
                                  )
                                }
                                className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 font-semibold text-[11px] transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-0.5 shadow-sm whitespace-nowrap"
                                title="Allocate +5 Seats Add-on Pack"
                              >
                                <span>+5 Seats</span>
                              </button>
                              <button
                                disabled={isActionLoading}
                                onClick={() => {
                                  setSeatAdjustCompany(c);
                                  setCustomSeatMode('add');
                                  setCustomSeatAmount(5);
                                }}
                                className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 border border-purple-500/30 font-semibold text-[11px] transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1 shadow-sm whitespace-nowrap"
                                title="Adjust custom seats quota (+ / - custom number)"
                              >
                                <Sliders className="w-3 h-3" />
                                <span>Custom</span>
                              </button>
                            </div>
                          )}

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
                            <>
                              <button
                                disabled={isActionLoading}
                                onClick={() => executeAction(c.id, 'reactivate')}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 font-semibold text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                Reactivate
                              </button>
                              <button
                                disabled={isActionLoading}
                                onClick={() => {
                                  setDeletingCompany(c);
                                  setDeleteError(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 font-semibold text-[11px] transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                                title="Permanently delete suspended organization"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </>
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

      {/* Delete Confirmation Modal */}
      {deletingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-950 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Permanently Delete Company</h3>
                  <p className="text-[11px] text-zinc-400">Irreversible tenant purge</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingCompany(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1.5">
              <p className="font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Warning: Destructive Action</span>
              </p>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                You are about to completely delete <strong className="text-white">{deletingCompany.name}</strong> (<span className="font-mono text-zinc-400">/c/{deletingCompany.slug}</span>).
              </p>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                All associated employee memberships, departments, designations, projects, tasks, comments, deliverables, and chat rooms will be permanently deleted.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCompany(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === deletingCompany.id}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {actionLoadingId === deletingCompany.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Records...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
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
                  {selectedCompanyDetails.created_by_profile?.full_name || selectedCompanyDetails.registrant_name || 'Not available'}
                </span>
                <span className="font-mono text-zinc-400 text-[11px] block">
                  {selectedCompanyDetails.created_by_profile?.email || selectedCompanyDetails.registrant_email || 'N/A'}
                </span>
                {selectedCompanyDetails.created_by_profile?.phone || selectedCompanyDetails.registrant_phone || selectedCompanyDetails.phone ? (
                  <a
                    href={`tel:${(selectedCompanyDetails.created_by_profile?.phone || selectedCompanyDetails.registrant_phone || selectedCompanyDetails.phone).replace(/\s+/g, '')}`}
                    className="font-mono text-emerald-400 hover:text-emerald-300 font-bold text-xs inline-flex items-center gap-1.5 pt-0.5 hover:underline"
                    title="Call applicant"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{selectedCompanyDetails.created_by_profile?.phone || selectedCompanyDetails.registrant_phone || selectedCompanyDetails.phone}</span>
                  </a>
                ) : (
                  <span className="text-[10px] text-zinc-500 italic block">No phone recorded</span>
                )}
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

            {/* Seat Capacity Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Member Seat Allocation & Quota
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-mono text-white">
                      {Number(selectedCompanyDetails.member_count || 0) + Number(selectedCompanyDetails.pending_count || 0)} / {selectedCompanyDetails.member_limit || 5} Seats
                    </span>
                    <span className="text-xs text-zinc-400">
                      ({selectedCompanyDetails.member_count || 0} active, {selectedCompanyDetails.pending_count || 0} pending)
                    </span>
                  </div>
                </div>

                {selectedCompanyDetails.status === 'approved' && (
                  <div className="flex items-center flex-wrap gap-2 shrink-0">
                    <button
                      disabled={
                        actionLoadingId === selectedCompanyDetails.id ||
                        Number(selectedCompanyDetails.member_limit || 5) <=
                          Number(selectedCompanyDetails.member_count || 0)
                      }
                      onClick={() =>
                        handleAdjustSeats(
                          selectedCompanyDetails.id,
                          selectedCompanyDetails.name,
                          -5,
                          Number(selectedCompanyDetails.member_limit || 5),
                          Number(selectedCompanyDetails.member_count || 0)
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs transition-colors border border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                      title="Reduce -5 Seats Quota"
                    >
                      -5 Seats
                    </button>
                    <button
                      disabled={
                        actionLoadingId === selectedCompanyDetails.id ||
                        Number(selectedCompanyDetails.member_limit || 5) <=
                          Number(selectedCompanyDetails.member_count || 0)
                      }
                      onClick={() =>
                        handleAdjustSeats(
                          selectedCompanyDetails.id,
                          selectedCompanyDetails.name,
                          -1,
                          Number(selectedCompanyDetails.member_limit || 5),
                          Number(selectedCompanyDetails.member_count || 0)
                        )
                      }
                      className="px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors border border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                      title="Reduce -1 Seat Quota"
                    >
                      -1 Seat
                    </button>
                    <button
                      disabled={actionLoadingId === selectedCompanyDetails.id}
                      onClick={() =>
                        handleAdjustSeats(
                          selectedCompanyDetails.id,
                          selectedCompanyDetails.name,
                          1,
                          Number(selectedCompanyDetails.member_limit || 5),
                          Number(selectedCompanyDetails.member_count || 0)
                        )
                      }
                      className="px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors border border-zinc-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      title="Allocate +1 Seat"
                    >
                      +1 Seat
                    </button>
                    <button
                      disabled={actionLoadingId === selectedCompanyDetails.id}
                      onClick={() =>
                        handleAdjustSeats(
                          selectedCompanyDetails.id,
                          selectedCompanyDetails.name,
                          5,
                          Number(selectedCompanyDetails.member_limit || 5),
                          Number(selectedCompanyDetails.member_count || 0)
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      +5 Seats
                    </button>
                    <button
                      disabled={actionLoadingId === selectedCompanyDetails.id}
                      onClick={() =>
                        handleAdjustSeats(
                          selectedCompanyDetails.id,
                          selectedCompanyDetails.name,
                          10,
                          Number(selectedCompanyDetails.member_limit || 5),
                          Number(selectedCompanyDetails.member_count || 0)
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors border border-zinc-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      +10 Seats
                    </button>
                  </div>
                )}
              </div>

              {/* Custom Number Input & Apply Row */}
              {selectedCompanyDetails.status === 'approved' && (
                <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/50">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-[11px] font-bold text-zinc-300">Custom Number:</span>
                    <div className="inline-flex items-center bg-zinc-950 border border-zinc-700 rounded-xl overflow-hidden p-0.5">
                      <button
                        type="button"
                        onClick={() => setModalCustomAmount((prev) => Math.max(1, prev - 1))}
                        className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Decrease amount"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={modalCustomAmount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setModalCustomAmount(isNaN(val) ? 1 : Math.max(1, val));
                        }}
                        className="w-14 bg-transparent text-center text-xs font-mono font-bold text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setModalCustomAmount((prev) => prev + 1)}
                        className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Increase amount"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 5, 10, 20, 50].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setModalCustomAmount(preset)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                            modalCustomAmount === preset
                              ? 'bg-zinc-700 text-white'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={
                        actionLoadingId === selectedCompanyDetails.id ||
                        Number(selectedCompanyDetails.member_limit || 5) <=
                          Number(selectedCompanyDetails.member_count || 0)
                      }
                      onClick={() =>
                        handleAdjustSeats(
                          selectedCompanyDetails.id,
                          selectedCompanyDetails.name,
                          -modalCustomAmount,
                          Number(selectedCompanyDetails.member_limit || 5),
                          Number(selectedCompanyDetails.member_count || 0)
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 font-semibold text-xs transition-colors border border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1 shadow-sm whitespace-nowrap"
                      title={`Reduce -${modalCustomAmount} Seats Quota`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Remove {modalCustomAmount} Seats</span>
                    </button>
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedCompanyDetails.id}
                      onClick={() =>
                        handleAdjustSeats(
                          selectedCompanyDetails.id,
                          selectedCompanyDetails.name,
                          modalCustomAmount,
                          Number(selectedCompanyDetails.member_limit || 5),
                          Number(selectedCompanyDetails.member_count || 0)
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                      title={`Allocate +${modalCustomAmount} Seats`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add {modalCustomAmount} Seats</span>
                    </button>
                  </div>
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

      {/* Custom Seat Adjustment Modal (from Table or Modal) */}
      {seatAdjustCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Adjust Seats Quota
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {seatAdjustCompany.name} • <span className="font-mono">/c/{seatAdjustCompany.slug}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSeatAdjustCompany(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector Tabs: Add vs Remove */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setCustomSeatMode('add')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  customSeatMode === 'add'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Seats (+)</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomSeatMode('remove')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  customSeatMode === 'remove'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Minus className="w-4 h-4" />
                <span>Remove Seats (-)</span>
              </button>
            </div>

            {/* Custom Amount Stepper & Presets */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <label className="text-xs font-semibold text-zinc-300 block">
                {customSeatMode === 'add' ? 'Number of seats to add:' : 'Number of seats to remove:'}
              </label>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center bg-zinc-950 border border-zinc-700 rounded-xl overflow-hidden p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setCustomSeatAmount((prev) => Math.max(1, prev - 1))}
                    className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={customSeatAmount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setCustomSeatAmount(isNaN(val) ? 1 : Math.max(1, val));
                    }}
                    className="w-20 bg-transparent text-center text-sm font-mono font-bold text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomSeatAmount((prev) => prev + 1)}
                    className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center flex-wrap gap-1.5">
                  {[1, 2, 5, 10, 20, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomSeatAmount(preset)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        customSeatAmount === preset
                          ? customSeatMode === 'add'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {customSeatMode === 'add' ? `+${preset}` : `-${preset}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Projected Calculation Preview */}
            {(() => {
              const curCap = Number(seatAdjustCompany.member_limit || 5);
              const curActive = Number(seatAdjustCompany.member_count || 0);
              const curPending = Number(seatAdjustCompany.pending_count || 0);
              const change = customSeatMode === 'add' ? customSeatAmount : -customSeatAmount;
              const projected = curCap + change;
              const maxReduction = Math.max(0, curCap - curActive);
              const isInvalid = customSeatMode === 'remove' && (projected < curActive || projected < 1);

              return (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Current Member Limit:</span>
                      <span className="font-mono font-bold text-white">{curCap} Seats</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Adjustment:</span>
                      <span
                        className={`font-mono font-bold ${
                          customSeatMode === 'add' ? 'text-indigo-400' : 'text-amber-400'
                        }`}
                      >
                        {customSeatMode === 'add' ? `+${customSeatAmount}` : `-${customSeatAmount}`} Seats
                      </span>
                    </div>
                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between font-bold text-sm">
                      <span className="text-zinc-200">Projected New Capacity:</span>
                      <span
                        className={`font-mono ${
                          isInvalid ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {projected} Seats
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 flex items-center justify-between">
                      <span>Active Usage:</span>
                      <span>
                        {curActive} active • {curPending} pending • {Math.max(0, projected - curActive)} available headroom
                      </span>
                    </div>
                  </div>

                  {isInvalid && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Cannot Reduce Below Active Usage</span>
                      </p>
                      <p className="text-[11px] text-zinc-300">
                        "{seatAdjustCompany.name}" currently has <strong>{curActive}</strong> active members. The maximum allowable reduction is <strong>{maxReduction}</strong> seat(s).
                      </p>
                      {maxReduction > 0 && (
                        <button
                          type="button"
                          onClick={() => setCustomSeatAmount(maxReduction)}
                          className="mt-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Set to Maximum Reduction (-{maxReduction} Seats)
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSeatAdjustCompany(null)}
                      className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isInvalid || actionLoadingId === seatAdjustCompany.id}
                      onClick={async () => {
                        const amount = customSeatMode === 'add' ? customSeatAmount : -customSeatAmount;
                        await handleAdjustSeats(
                          seatAdjustCompany.id,
                          seatAdjustCompany.name,
                          amount,
                          curCap,
                          curActive,
                          true
                        );
                        setSeatAdjustCompany(null);
                      }}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                        customSeatMode === 'add'
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                          : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                      }`}
                    >
                      {actionLoadingId === seatAdjustCompany.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Applying Changes...</span>
                        </>
                      ) : (
                        <span>
                          Apply {customSeatMode === 'add' ? `+${customSeatAmount}` : `-${customSeatAmount}`} Seats
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
