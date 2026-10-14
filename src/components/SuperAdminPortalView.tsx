'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { saasStore } from '@/lib/storage';
import { Company } from '@/lib/types';
import { audioEngine } from '@/lib/audio';
import { ThemeToggle } from './ThemeToggle';
import { authService } from '@/lib/auth';

interface SuperAdminPortalViewProps {
  onLogout: () => void;
}

export const SuperAdminPortalView: React.FC<SuperAdminPortalViewProps> = ({ onLogout }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Company Form fields (Simplified: Name, Slug, Admin Name, Admin Email)
  const [newName, setNewName] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    saasStore.initData();
    const update = () => {
      setCompanies(saasStore.getCompanies());
    };
    update();
    const unsub = saasStore.subscribe(update);
    return unsub;
  }, []);

  const activeCount = companies.filter((c) => c.is_active).length;
  const suspendedCount = companies.filter((c) => !c.is_active).length;

  const handleToggleStatus = (id: string) => {
    saasStore.toggleCompanyStatus(id);
    audioEngine.playBellChime();
  };

  const handleDeleteCompany = (id: string, name: string) => {
    if (
      typeof window !== 'undefined' &&
      window.confirm(
        `⚠️ PERMANENT DELETION:\n\nAre you sure you want to completely delete "${name}"?\n\nThis will permanently delete all company records, tasks, files, employee accounts, and messages from the platform.`
      )
    ) {
      saasStore.deleteCompany(id);
      audioEngine.playUrgentAlert();
    }
  };

  const handleCopyUrl = (subdomain: string, compId: string) => {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/workspace/${subdomain}`
      : `http://localhost:3000/workspace/${subdomain}`;
    navigator.clipboard.writeText(url);
    setCopiedId(compId);
    audioEngine.playBellChime();
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCompanyNameChange = (value: string) => {
    setNewName(value);
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setNewSubdomain(slug);
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSubdomain.trim()) return;

    const newCompany = saasStore.addCompany({
      name: newName.trim(),
      subdomain: newSubdomain.trim(),
      plan: 'pro',
      max_users: 50,
      storage_limit_mb: 10000,
      is_active: true,
      approval_status: 'approved',
      admin_name: newAdminName.trim() || 'Company Admin',
      admin_email: newAdminEmail.trim() || `admin@${newSubdomain}.agency`,
      mrr: 0,
    });

    if (newAdminEmail.trim() && newAdminName.trim()) {
      authService.addEmployee({
        companyId: newCompany.id,
        fullName: newAdminName.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        password: 'admin123',
        department: 'Development',
        role: 'company_admin',
        designation: 'Company CEO',
      });
    }

    setIsNewModalOpen(false);
    setNewName('');
    setNewSubdomain('');
    setNewAdminName('');
    setNewAdminEmail('');
    audioEngine.playSuccessChime();
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subdomain.toLowerCase().includes(search.toLowerCase()) ||
      (c.admin_email && c.admin_email.toLowerCase().includes(search.toLowerCase()));

    if (statusFilter === 'active') return matchesSearch && c.is_active;
    if (statusFilter === 'suspended') return matchesSearch && !c.is_active;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Super Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                  Adsetspro SaaS
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white uppercase tracking-wider shadow-xs">
                  👑 Platform Owner
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
                Master Tenant Administration & Credential Approval Console
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />

            {/* Platform Owner Profile Chip */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Alexandre Sterling</span>
              <span className="text-zinc-400 font-mono text-[11px]">(owner@adsetspro.com)</span>
            </div>

            {/* Log Out Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer shrink-0"
              title="Log Out of Super Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Super Admin Body (Zero Tasks, Pure Company Administration) */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-zinc-900/90 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <Shield className="w-3.5 h-3.5" />
              <span>Global Multi-Tenant Authority</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Company & Tenant Control Center
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Review all client companies, approve/reject access credentials, distribute dedicated tenant URLs, and toggle platform access <strong>ON / OFF</strong> in real-time. Client companies are strictly isolated and cannot view each other.
            </p>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/25 hover:scale-[1.02] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Provision New Company</span>
          </button>
        </div>

        {/* 3. Platform Telemetry Metrics (Cleaned up: Zero prices, Zero team capacity) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Total Client Companies</span>
              <Building2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {companies.length}
            </div>
            <div className="text-[11px] text-zinc-500 font-medium">
              Registered client company accounts
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Active Live Tenants</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </div>
            <div className="text-[11px] text-zinc-500 font-medium">
              Toggled ON & actively using workspace
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Suspended / Locked</span>
              <Lock className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-black text-red-600 dark:text-red-400">
              {suspendedCount}
            </div>
            <div className="text-[11px] text-red-600 dark:text-red-400 font-bold">
              🔴 Toggled OFF (Locked out)
            </div>
          </div>
        </div>

        {/* 4. Companies Filter & Control Toolbar */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies, subdomains, admin emails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              All Companies ({companies.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              🟢 Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'suspended'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              🔴 Suspended ({suspendedCount})
            </button>
          </div>
        </div>

        {/* 5. Company Roster Cards with Dedicated URL, Master ON/OFF Switch, Approval, and Delete */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Registered Client Companies ({filteredCompanies.length})
            </h2>
            <span className="text-xs text-zinc-400">
              Click ON/OFF to toggle access • Click Delete to permanently remove agency records
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredCompanies.map((comp) => {
              const isActive = comp.is_active;
              const companyUrl = typeof window !== 'undefined'
                ? `${window.location.origin}/workspace/${comp.subdomain}`
                : `http://localhost:3000/workspace/${comp.subdomain}`;

              return (
                <div
                  key={comp.id}
                  className={`bg-white dark:bg-zinc-900 rounded-3xl border p-5 sm:p-6 transition-all shadow-sm ${
                    isActive
                      ? 'border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50'
                      : 'border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Left: Company Details & Direct URL (No Plans, No Prices) */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
                          isActive
                            ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                            : 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400'
                        }`}>
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                              {comp.name}
                            </h3>

                            {/* Status Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800'
                              }`}
                            >
                              {isActive
                                ? '🟢 Active & Approved'
                                : '🔴 Suspended (OFF)'}
                            </span>
                          </div>

                          {/* Company Admin Credentials Info */}
                          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            <span>Admin:</span>
                            <strong className="text-zinc-800 dark:text-zinc-200">
                              {comp.admin_name || 'CEO / Admin'}
                            </strong>
                            <span>•</span>
                            <span className="font-mono text-zinc-500">{comp.admin_email || `admin@${comp.subdomain}.agency`}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dedicated Company Tenant URL with 1-Click Copy */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
                          Dedicated Tenant URL:
                        </span>
                        <a
                          href={companyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline truncate flex-1"
                        >
                          {companyUrl}
                        </a>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleCopyUrl(comp.subdomain, comp.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-bold border border-zinc-200 dark:border-zinc-600 transition-all cursor-pointer shadow-2xs"
                            title="Copy Tenant URL to clipboard"
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
                            href={companyUrl}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-all"
                            title="Open this company workspace"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Right: Master ON/OFF Switch and Delete Button */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800 shrink-0">
                      {/* Master ON/OFF Toggle Switch */}
                      <button
                        onClick={() => handleToggleStatus(comp.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all shadow-md cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                            : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                        }`}
                        title={isActive ? 'Click to turn OFF (Suspend Workspace)' : 'Click to turn ON (Activate Workspace)'}
                      >
                        {isActive ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>ACTIVE (ON)</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>SUSPENDED (OFF)</span>
                          </>
                        )}
                      </button>

                      {/* DELETE COMPANY & ALL RECORDS BUTTON */}
                      <button
                        onClick={() => handleDeleteCompany(comp.id, comp.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        title="Permanently delete company and wipe all associated records"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 6. Modal: Provision New Company Tenant (Pure Company Name, Auto-generated Read-only Slug, Admin Details) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsNewModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
                  Provision New Client Company
                </h3>
                <p className="text-xs text-zinc-500">
                  Enter company details. The tenant URL will be generated automatically.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              {/* 1. Company Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Digital Agency"
                  value={newName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* 2. Auto-Generated Slug (Read-only / Locked / Non-editable) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Dedicated Tenant URL (Auto-Generated)
                  </label>
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    🔒 Locked (Auto-generated from Company Name)
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="px-3 py-2 text-xs rounded-l-xl border border-r-0 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                    /workspace/
                  </span>
                  <input
                    type="text"
                    readOnly
                    disabled
                    placeholder="company-slug"
                    value={newSubdomain}
                    className="flex-1 px-3 py-2 text-xs rounded-r-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 font-mono cursor-not-allowed select-all"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  The URL slug is generated automatically based on the company name and cannot be manually edited.
                </p>
              </div>

              {/* 3. Company Admin Name & Admin Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Company Admin Name
                  </label>
                  <input
                    type="text"
                    placeholder="Sarah Lin"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="sarah@apex.agency"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim() || !newSubdomain.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  Provision & Launch Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
