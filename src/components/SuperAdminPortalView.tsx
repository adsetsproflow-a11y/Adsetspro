'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Building2,
  Users,
  Plus,
  Play,
  Pause,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  Search,
  LogOut,
  AlertTriangle,
  Lock,
  Layers,
  Sparkles,
  RefreshCw,
  Mail,
  X,
  Trash2,
  FileText,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { audioEngine } from '@/lib/audio';
import { ThemeToggle } from './ThemeToggle';

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string | null;
  suspensionReason?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  adminName: string;
  adminEmail: string;
  adminEmailVerified: boolean;
  employeeCount: number;
  taskCount: number;
  invitationCount: number;
  workspaceUrl: string;
}

interface AuditLogEntry {
  id: string;
  actorUserId?: string | null;
  actor?: { name: string; email: string } | null;
  companyId?: string | null;
  company?: { name: string; slug: string } | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: string | null;
  createdAt: string;
}

interface SuperAdminPortalViewProps {
  onLogout?: () => void;
}

export const SuperAdminPortalView: React.FC<SuperAdminPortalViewProps> = ({ onLogout }) => {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'companies' | 'audit_logs'>('companies');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Company Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newPassword, setNewPassword] = useState('admin123');

  // Reject / Suspend reason modal state
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    companyId: string;
    companyName: string;
    actionType: 'reject' | 'suspend';
    reason: string;
  }>({
    isOpen: false,
    companyId: '',
    companyName: '',
    actionType: 'reject',
    reason: '',
  });

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/super-admin/companies');
      const data = await res.json();
      if (data.success && Array.isArray(data.companies)) {
        setCompanies(data.companies);
      }
    } catch (err) {
      console.warn('Failed to load companies from DB API:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/super-admin/audit-logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchAuditLogs();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/super-admin/companies/${id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        audioEngine.playSuccessChime();
        await fetchCompanies();
        await fetchAuditLogs();
      } else {
        alert(data.error || 'Failed to approve company');
      }
    } catch {
      alert('Network error while approving company');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReasonModal = (companyId: string, companyName: string, actionType: 'reject' | 'suspend') => {
    setReasonModal({
      isOpen: true,
      companyId,
      companyName,
      actionType,
      reason: actionType === 'reject' ? 'Does not meet registration requirements' : 'Policy violation or pending payment',
    });
  };

  const handleConfirmReasonModal = async () => {
    const { companyId, actionType, reason } = reasonModal;
    setActionLoadingId(companyId);
    setReasonModal((prev) => ({ ...prev, isOpen: false }));

    try {
      const endpoint =
        actionType === 'reject'
          ? `/api/super-admin/companies/${companyId}/reject`
          : `/api/super-admin/companies/${companyId}/suspend`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        audioEngine.playUrgentAlert();
        await fetchCompanies();
        await fetchAuditLogs();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch {
      alert('Network error while processing company update');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReactivate = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/super-admin/companies/${id}/reactivate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        audioEngine.playBellChime();
        await fetchCompanies();
        await fetchAuditLogs();
      } else {
        alert(data.error || 'Failed to reactivate company');
      }
    } catch {
      alert('Network error while reactivating company');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyUrl = (slug: string, compId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}/c/${slug}/dashboard`;
    navigator.clipboard.writeText(url);
    setCopiedId(compId);
    audioEngine.playBellChime();
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAdminName.trim() || !newAdminEmail.trim()) return;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: newName.trim(),
          adminName: newAdminName.trim(),
          email: newAdminEmail.trim().toLowerCase(),
          password: newPassword,
          confirmPassword: newPassword,
          department: 'Management',
          acceptTerms: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsNewModalOpen(false);
        setNewName('');
        setNewAdminName('');
        setNewAdminEmail('');
        audioEngine.playSuccessChime();
        await fetchCompanies();
        await fetchAuditLogs();
      } else {
        alert(data.error || 'Failed to create company');
      }
    } catch {
      alert('Network error while registering company');
    }
  };

  const handleDefaultLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    }
  };

  // Metric counts
  const totalCount = companies.length;
  const pendingCount = companies.filter((c) => c.status === 'PENDING').length;
  const activeCount = companies.filter((c) => c.status === 'ACTIVE').length;
  const suspendedCount = companies.filter((c) => c.status === 'SUSPENDED').length;
  const rejectedCount = companies.filter((c) => c.status === 'REJECTED').length;

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      (c.adminEmail && c.adminEmail.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                SAAA Platform Owner
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Multi-Tenant Company Review, Approvals & Audit Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            <span>owner@adsetspro.com</span>
          </div>

          <ThemeToggle />

          <button
            onClick={handleDefaultLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-bold transition-all cursor-pointer"
            title="Log out of Super Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Banner Alert for Pending Companies */}
        {pendingCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-extrabold">
                  {pendingCount} Company Registration{pendingCount > 1 ? 's' : ''} Awaiting Review
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                  New companies must be reviewed and approved before company admins and employees can access their workspace.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('companies');
                setStatusFilter('PENDING');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Review Pending ({pendingCount})
            </button>
          </div>
        )}

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase">Total Companies</p>
              <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{totalCount}</p>
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab('companies');
              setStatusFilter('PENDING');
            }}
            className="bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">Pending Review</p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</p>
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab('companies');
              setStatusFilter('ACTIVE');
            }}
            className="bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Active Workspaces</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</p>
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab('companies');
              setStatusFilter('SUSPENDED');
            }}
            className="bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-800/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Pause className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase">Suspended</p>
              <p className="text-xl font-black text-red-600 dark:text-red-400">{suspendedCount}</p>
            </div>
          </div>
        </div>

        {/* Tab Selector & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'companies'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Companies & Approvals ({companies.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('audit_logs');
                fetchAuditLogs();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'audit_logs'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Security Audit Logs</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchCompanies();
                fetchAuditLogs();
              }}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shadow-xs"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Company</span>
            </button>
          </div>
        </div>

        {/* 1. Companies & Approvals Tab */}
        {activeTab === 'companies' && (
          <div className="space-y-4">
            {/* Filter Pills and Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {st === 'all'
                      ? 'All Companies'
                      : st === 'PENDING'
                      ? `Pending Approvals (${pendingCount})`
                      : st === 'ACTIVE'
                      ? `Active (${activeCount})`
                      : st === 'SUSPENDED'
                      ? `Suspended (${suspendedCount})`
                      : `Rejected (${rejectedCount})`}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, slug, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Companies List */}
            {loading ? (
              <div className="py-16 text-center text-xs text-zinc-400 space-y-2">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading company records from PostgreSQL database...</p>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/50 space-y-2">
                <Building2 className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">No matching companies found</p>
                <p className="text-xs text-zinc-400">Try adjusting your status filter or search query.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredCompanies.map((comp) => {
                  const isPending = comp.status === 'PENDING';
                  const isActive = comp.status === 'ACTIVE';
                  const isSuspended = comp.status === 'SUSPENDED';
                  const isRejected = comp.status === 'REJECTED';
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                  const fullUrl = `${origin}/c/${comp.slug}/dashboard`;

                  return (
                    <div
                      key={comp.id}
                      className={`bg-white dark:bg-zinc-900 border rounded-3xl p-5 sm:p-6 shadow-sm transition-all space-y-4 ${
                        isPending
                          ? 'border-amber-300 dark:border-amber-800/80 bg-amber-500/[0.02]'
                          : isSuspended
                          ? 'border-red-300 dark:border-red-900/80 bg-red-500/[0.02]'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Company info */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                              {comp.name}
                            </h3>

                            {/* Status badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isPending
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  : isActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : isSuspended
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800'
                                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
                              }`}
                            >
                              {isPending
                                ? '⏳ Pending Approval'
                                : isActive
                                ? '🟢 Active & Approved'
                                : isSuspended
                                ? '🔴 Suspended (OFF)'
                                : '⚪ Rejected'}
                            </span>

                            {comp.adminEmailVerified ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                ✓ Email Verified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                Email Unverified
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                            <span>
                              Admin: <strong className="text-zinc-800 dark:text-zinc-200">{comp.adminName}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-mono">{comp.adminEmail}</span>
                            <span>•</span>
                            <span>Employees: <strong className="text-zinc-800 dark:text-zinc-200">{comp.employeeCount}</strong></span>
                            <span>•</span>
                            <span>Registered: {new Date(comp.createdAt).toLocaleDateString()}</span>
                          </div>

                          {comp.rejectionReason && (
                            <p className="text-xs text-red-500 font-medium">
                              Rejection note: {comp.rejectionReason}
                            </p>
                          )}
                          {comp.suspensionReason && (
                            <p className="text-xs text-red-500 font-medium">
                              Suspension note: {comp.suspensionReason}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(comp.id, comp.name)}
                                disabled={actionLoadingId === comp.id}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approve Company</span>
                              </button>
                              <button
                                onClick={() => handleOpenReasonModal(comp.id, comp.name, 'reject')}
                                disabled={actionLoadingId === comp.id}
                                className="px-3.5 py-2 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isActive && (
                            <button
                              onClick={() => handleOpenReasonModal(comp.id, comp.name, 'suspend')}
                              disabled={actionLoadingId === comp.id}
                              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>Suspend (Turn OFF)</span>
                            </button>
                          )}

                          {isSuspended && (
                            <button
                              onClick={() => handleReactivate(comp.id)}
                              disabled={actionLoadingId === comp.id}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Reactivate (Turn ON)</span>
                            </button>
                          )}

                          {isRejected && (
                            <button
                              onClick={() => handleApprove(comp.id, comp.name)}
                              disabled={actionLoadingId === comp.id}
                              className="px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                              Re-evaluate & Approve
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Workspace URL Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
                          Company URL:
                        </span>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline truncate flex-1"
                        >
                          {fullUrl}
                        </a>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleCopyUrl(comp.slug, comp.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-bold border border-zinc-200 dark:border-zinc-600 transition-all cursor-pointer"
                          >
                            {copiedId === comp.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                          <a
                            href={fullUrl}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold border border-indigo-200 dark:border-indigo-800"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. Security Audit Logs Tab */}
        {activeTab === 'audit_logs' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Security & Administrative Audit Trail
                </h3>
                <p className="text-xs text-zinc-500">
                  Immutable chronological log of company approvals, registration events, password updates, and session events.
                </p>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Logs</span>
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                No audit log records recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Actor</th>
                      <th className="py-2.5 px-3">Company Target</th>
                      <th className="py-2.5 px-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="py-2.5 px-3 font-mono text-zinc-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-zinc-800 dark:text-zinc-200">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              log.action.includes('APPROVED')
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : log.action.includes('REJECTED') || log.action.includes('SUSPENDED')
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                          {log.actor?.name || log.actor?.email || log.actorUserId || 'System'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-500">
                          {log.company?.name ? `${log.company.name} (/c/${log.company.slug})` : log.companyId || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500 max-w-xs truncate">
                          {log.metadata || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Reject / Suspend Reason Modal */}
      {reasonModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {reasonModal.actionType === 'reject' ? 'Reject Company Registration' : 'Suspend Company Workspace'}
              </h3>
              <button
                onClick={() => setReasonModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Provide a reason for this administrative action against <strong>{reasonModal.companyName}</strong>. This note will be recorded in security audit logs.
            </p>

            <textarea
              rows={3}
              value={reasonModal.reason}
              onChange={(e) => setReasonModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason..."
              className="w-full p-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReasonModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReasonModal}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                Confirm {reasonModal.actionType === 'reject' ? 'Rejection' : 'Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Company Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Register New Client Company
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Digital"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Company Admin Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Lin"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Company Admin Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@apexdigital.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md mt-2"
              >
                Create Company & Reserve Slug
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
