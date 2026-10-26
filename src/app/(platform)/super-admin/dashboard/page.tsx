'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SuperAdminDashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalCompanies: 0,
    pendingApprovals: 0,
    activeCompanies: 0,
    suspendedCompanies: 0,
    totalUsers: 0,
  });
  const [recentCompanies, setRecentCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/super-admin/dashboard');
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
        setRecentCompanies(data.recentCompanies || []);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Adsetspro Flow Control Center</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Platform-wide tenant overview, pending approvals, and system metrics
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Companies</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalCompanies}</p>
          <p className="text-[11px] text-zinc-500">Registered tenants</p>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300">{stats.pendingApprovals}</p>
          <Link
            href="/super-admin/approvals"
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
          >
            Review Queue <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Companies</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300">{stats.activeCompanies}</p>
          <p className="text-[11px] text-emerald-400/80">Approved & Operating</p>
        </div>

        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
          <div className="flex items-center justify-between text-red-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Suspended</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-black text-red-300">{stats.suspendedCompanies}</p>
          <p className="text-[11px] text-red-400/80">Access Restricted</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Platform Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
          <p className="text-[11px] text-zinc-500">Total profiles across tenants</p>
        </div>
      </div>

      {/* Recent Companies Section (Full Width) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Company Registrations</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Newly onboarded enterprise tenants across the platform</p>
          </div>
          <Link
            href="/super-admin/companies"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1.5"
          >
            <span>View all companies</span>
            <span>→</span>
          </Link>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {recentCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                      No registered organizations found.
                    </td>
                  </tr>
                ) : (
                  recentCompanies.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-zinc-200">{c.name}</td>
                      <td className="py-3 px-4 font-mono text-zinc-400">/c/{c.slug}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            c.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : c.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href="/super-admin/companies"
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          Manage
                        </Link>
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
