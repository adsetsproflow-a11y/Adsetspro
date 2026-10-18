'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Check,
  Building2,
  RefreshCw,
  Mail,
  User,
  Calendar,
  AlertTriangle,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PendingCompany {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  created_by_profile?: {
    full_name: string;
    email: string;
  } | null;
}

export default function SuperAdminApprovalsPage() {
  const supabase = createClient();
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Reject Modal state
  const [modalCompany, setModalCompany] = useState<PendingCompany | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);

  // Alert Feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/super-admin/companies?status=pending');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch pending approval queue.');
      }

      setPendingCompanies(data.companies || []);
    } catch (err: any) {
      console.error('Failed to load pending companies:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to fetch pending approval queue.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (company: PendingCompany) => {
    setActionLoadingId(company.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/super-admin/companies/${company.id}/approve`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve workspace.');
      }

      setFeedback({
        type: 'success',
        message: `Workspace "${company.name}" has been approved and activated.`,
      });
      fetchPending();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Approval action failed.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!modalCompany) return;
    if (!rejectReason.trim()) {
      setRejectError('Please provide a reason for rejecting this workspace application.');
      return;
    }

    setIsRejectSubmitting(true);
    setRejectError(null);

    try {
      const res = await fetch(`/api/super-admin/companies/${modalCompany.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject workspace.');
      }

      setFeedback({
        type: 'success',
        message: `Workspace "${modalCompany.name}" rejected. The applicant has been notified.`,
      });
      setModalCompany(null);
      setRejectReason('');
      fetchPending();
    } catch (err: any) {
      setRejectError(err.message || 'Failed to execute rejection.');
    } finally {
      setIsRejectSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Pending Queue ({pendingCompanies.length})
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Pending Approvals</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Review onboarding requests, verify company details, and authorize tenant workspaces
          </p>
        </div>
        <button
          onClick={fetchPending}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content: Pending list or Empty state */}
      {pendingCompanies.length === 0 && !isLoading ? (
        <div className="py-16 px-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Check className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No pending approvals</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              All company registration requests have been reviewed and resolved. New organization onboarding submissions will appear here automatically.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingCompanies.map((company) => {
            const adminName = company.created_by_profile?.full_name || 'Organization Applicant';
            const adminEmail = company.created_by_profile?.email || 'No email associated';
            const isProcessing = actionLoadingId === company.id;

            return (
              <div
                key={company.id}
                className="p-5 sm:p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Company & Admin info */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-xl shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white">{company.name}</h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300 border border-zinc-700/60">
                        /c/{company.slug}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Pending Verification
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-zinc-200 font-medium truncate">{adminName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-zinc-300 truncate">{adminEmail}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Registered {new Date(company.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0 self-end lg:self-center w-full lg:w-auto">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleApprove(company)}
                    className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Quick Approve</span>
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => {
                      setModalCompany(company);
                      setRejectReason('');
                      setRejectError(null);
                    }}
                    className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 font-semibold text-xs inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {modalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Decline Registration</h3>
                  <p className="text-xs text-zinc-400">
                    Workspace: <span className="text-zinc-200 font-semibold">{modalCompany.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalCompany(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">
                Rejection Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Specify reason for decline (e.g., Unverifiable business credentials, invalid domain, policy violation)..."
                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 resize-none"
              />
              <p className="text-[11px] text-zinc-500">
                This notice will be recorded in the audit logs and sent to {modalCompany.created_by_profile?.email || 'the applicant'}.
              </p>
              {rejectError && <p className="text-xs text-red-400 pt-1">{rejectError}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalCompany(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRejectSubmitting}
                onClick={handleConfirmReject}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isRejectSubmitting ? (
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
    </div>
  );
}
