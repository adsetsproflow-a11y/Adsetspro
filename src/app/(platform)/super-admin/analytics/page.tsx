'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Building2,
  Users,
  CheckCircle,
  Activity,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SuperAdminAnalyticsPage() {
  const supabase = createClient();
  const [metrics, setMetrics] = useState({
    totalCompanies: 0,
    totalProfiles: 0,
    activeTasks: 0,
    totalLogs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/super-admin/analytics');
        const data = await res.json();
        if (data.success && data.metrics) {
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.error('Failed to load platform analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <BarChart3 className="w-3 h-3" />
            Platform Insights
          </span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">System Analytics</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Cross-tenant operational performance, platform adoption rates, and growth trajectory
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Organizations</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{metrics.totalCompanies}</p>
          <p className="text-[11px] text-zinc-500">Multi-tenant accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Identities</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white">{metrics.totalProfiles}</p>
          <p className="text-[11px] text-zinc-500">Global user accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Managed Tasks</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{metrics.activeTasks}</p>
          <p className="text-[11px] text-zinc-500">Total pipeline units</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Audit Trail</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{metrics.totalLogs}</p>
          <p className="text-[11px] text-zinc-500">System actions recorded</p>
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-center space-y-3">
        <TrendingUp className="w-10 h-10 text-cyan-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Cross-Tenant Metric Aggregator</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Tenant-level telemetry, storage utilization, and API throughput trends are synchronized with Supabase live event streams.
        </p>
      </div>
    </div>
  );
}
