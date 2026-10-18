'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  ChevronDown,
  ChevronUp,
  FileCode,
  Layers,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AuditLogRecord {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  actor_id: string | null;
  company_id: string | null;
  details: Record<string, any>;
  created_at: string;
  actor?: {
    full_name: string;
    email: string;
  } | null;
}

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'COMPANY_REGISTERED', label: 'Company Registered' },
  { value: 'COMPANY_APPROVED', label: 'Company Approved' },
  { value: 'COMPANY_REJECTED', label: 'Company Rejected' },
  { value: 'COMPANY_SUSPENDED', label: 'Company Suspended' },
  { value: 'COMPANY_REACTIVATED', label: 'Company Reactivated' },
  { value: 'USER_LOGIN', label: 'User Login' },
  { value: 'USER_INVITED', label: 'User Invited' },
  { value: 'TASK_CREATED', label: 'Task Created' },
  { value: 'TASK_STATUS_CHANGED', label: 'Task Status Changed' },
];

export default function SuperAdminAuditLogsPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedAction, setSelectedAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Row inspection
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAction !== 'all') params.set('action', selectedAction);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/super-admin/audit-logs?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction, startDate, endDate]);

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const actorName = l.actor?.full_name?.toLowerCase() || '';
    const actorEmail = l.actor?.email?.toLowerCase() || '';
    const action = l.action?.toLowerCase() || '';
    const targetType = l.target_type?.toLowerCase() || '';
    const targetId = l.target_id?.toLowerCase() || '';
    const detailsStr = JSON.stringify(l.details || {}).toLowerCase();

    return (
      actorName.includes(query) ||
      actorEmail.includes(query) ||
      action.includes(query) ||
      targetType.includes(query) ||
      targetId.includes(query) ||
      detailsStr.includes(query)
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleExpand = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVED')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (action.includes('REJECTED') || action.includes('SUSPENDED')) return 'bg-red-500/10 text-red-400 border-red-500/30';
    if (action.includes('REGISTERED')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (action.includes('REACTIVATED')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-3 h-3" />
              Compliance Ledger
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Platform Audit Logs</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Immutable tracking of administrative actions, company lifecycle changes, and security events
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action Type Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Action Type
            </label>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-red-500"
            >
              {ACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range - From */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              From Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Date Range - To */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Clear Filter button */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <button
              onClick={() => {
                setSelectedAction('all');
                setStartDate('');
                setEndDate('');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by actor name, email, target ID, or payload details..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target</th>
                <th className="py-3.5 px-4">Date / Time</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    No audit records match the selected parameters.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const isExpanded = expandedRowId === log.id;
                  const actorName = log.actor?.full_name || 'System Service';
                  const actorEmail = log.actor?.email;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-zinc-800/30 transition-colors">
                        {/* Actor */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 font-bold shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-zinc-200 block truncate">
                                {actorName}
                              </span>
                              {actorEmail && (
                                <span className="text-[11px] text-zinc-500 font-mono block truncate">
                                  {actorEmail}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Target */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-medium text-zinc-300 capitalize block">
                              {log.target_type}
                            </span>
                            {log.target_id && (
                              <span className="font-mono text-[11px] text-zinc-500 block truncate max-w-[200px]">
                                {log.target_id}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date/Time */}
                        <td className="py-3.5 px-4 text-zinc-400">
                          <div className="space-y-0.5">
                            <span className="block text-zinc-200">
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                            <span className="block text-[11px] text-zinc-500 font-mono">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>

                        {/* Expand Details */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                            <span>Payload</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON details drawer */}
                      {isExpanded && (
                        <tr className="bg-zinc-950/80">
                          <td colSpan={5} className="p-4 border-b border-zinc-800">
                            <div className="rounded-xl bg-zinc-900 border border-zinc-800/80 p-3 space-y-2">
                              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                                <span>Event ID: {log.id}</span>
                                <span>Company ID: {log.company_id || 'Global Platform'}</span>
                              </div>
                              <pre className="text-[11px] font-mono text-zinc-300 bg-black/60 p-3 rounded-lg overflow-x-auto border border-zinc-800">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
              {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length}{' '}
              records
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
    </div>
  );
}
