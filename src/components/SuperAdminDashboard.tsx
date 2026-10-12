'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Building2,
  DollarSign,
  Users,
  HardDrive,
  Plus,
  Play,
  Pause,
  CheckCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { saasStore } from '@/lib/storage';
import { Company } from '@/lib/types';
import { audioEngine } from '@/lib/audio';

interface SuperAdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [plan, setPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [maxUsers, setMaxUsers] = useState(25);
  const [storageLimitMb, setStorageLimitMb] = useState(5000);
  const [mrr, setMrr] = useState(1200);

  useEffect(() => {
    const update = () => {
      setCompanies(saasStore.getCompanies());
    };
    update();
    const unsub = saasStore.subscribe(update);
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const totalMrr = companies.reduce((acc, c) => acc + (c.is_active ? c.mrr : 0), 0);
  const totalUsersAllowed = companies.reduce((acc, c) => acc + c.max_users, 0);
  const totalStorageMb = companies.reduce((acc, c) => acc + c.storage_limit_mb, 0);

  const handleToggleStatus = (id: string) => {
    saasStore.toggleCompanyStatus(id);
    audioEngine.playBellChime();
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subdomain.trim()) return;

    saasStore.addCompany({
      name: name.trim(),
      subdomain: subdomain.trim().toLowerCase(),
      plan,
      max_users: maxUsers,
      storage_limit_mb: storageLimitMb,
      is_active: true,
      mrr,
    });

    setIsNewModalOpen(false);
    setName('');
    setSubdomain('');
    audioEngine.playSuccessChime();
  };

  const handleSwitchToTenant = (compId: string) => {
    saasStore.setActiveCompanyId(compId);
    audioEngine.playBellChime();
    const comp = companies.find((c) => c.id === compId);
    if (comp) {
      window.location.href = `/workspace/${comp.subdomain}`;
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Super Admin Global Console
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                Platform Owner
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Cross-tenant telemetry, subscription health, quotas, and multi-tenant subdomains.
            </p>
          </div>
        </div>

        {/* Top Telemetry Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Platform MRR</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              ${totalMrr.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Active recurring subscriptions
            </span>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Provisioned Seats</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              {totalUsersAllowed}
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
              Across {companies.length} client companies
            </span>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Storage Quota Pool</span>
              <HardDrive className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              {(totalStorageMb / 1024).toFixed(1)} GB
            </div>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
              Supabase Storage multi-tenant buckets
            </span>
          </div>
        </div>

        {/* Tenant Companies List & Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Registered Client Tenants
            </h3>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision Tenant</span>
            </button>
          </div>

          <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Adsetspro SaaS Platform Owner Controls:</span> Each client company below operates on its own isolated subdomain URL. Use the <strong>TOGGLE SWITCH (ON / OFF)</strong> on each company. When toggled <strong>OFF</strong>, that company's workspace and features (Zoho Task Board, WebP Studio, Chat) are locked until payment or reactivation.
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
            {companies.map((comp) => (
              <div
                key={comp.id}
                className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-50/40 dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {comp.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          comp.is_active
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {comp.is_active ? '● Active' : '✕ Suspended'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5 font-mono">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{comp.subdomain}.domain.com</span>
                      <span>•</span>
                      <span className="capitalize">{comp.plan}</span>
                      <span>•</span>
                      <span>${comp.mrr}/mo</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  {/* PROMINENT TOGGLE SWITCH (ON / OFF) */}
                  <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xs">
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                        Toggle
                      </span>
                      <span
                        className={`text-xs font-black ${
                          comp.is_active
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {comp.is_active ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={comp.is_active}
                      onClick={() => handleToggleStatus(comp.id)}
                      className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                        comp.is_active ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                      title={comp.is_active ? 'Click to Toggle OFF (Suspend Company)' : 'Click to Toggle ON (Activate Company)'}
                    >
                      <span className="sr-only">Toggle company access</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          comp.is_active ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <button
                    onClick={() => handleSwitchToTenant(comp.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    title={`Open dedicated workspace URL (/workspace/${comp.subdomain})`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open URL</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Provision New Tenant */}
        {isNewModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-3">
                Provision New SaaS Client Tenant
              </h3>

              <form onSubmit={handleCreateCompany} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nexus Interactive"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Subdomain Slug
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      required
                      placeholder="nexus"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 px-3 py-2 text-xs rounded-l-xl border border-r-0 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <span className="px-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-r-xl border border-zinc-200 dark:border-zinc-700 font-mono">
                      .domain.com
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Plan Tier
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="starter">Starter</option>
                      <option value="pro">Pro ($2,400)</option>
                      <option value="enterprise">Enterprise ($5,800)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      MRR ($/mo)
                    </label>
                    <input
                      type="number"
                      value={mrr}
                      onChange={(e) => setMrr(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md cursor-pointer"
                  >
                    Create & Provision 🚀
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
