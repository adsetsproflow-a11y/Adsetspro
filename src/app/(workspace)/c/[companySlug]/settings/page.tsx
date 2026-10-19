'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings,
  Building,
  Tag,
  Shield,
  Lock,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
  Upload,
  AlertTriangle,
  RefreshCw,
  Users,
  KeyRound,
  FileCheck,
  ShieldCheck,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dateFormat';
import CenterLoader from '@/components/common/CenterLoader';
import { getCachedData, setCachedData } from '@/lib/cache/clientCache';

interface DesignationItem {
  id: string;
  name: string;
  createdAt: string;
  employeeCount: number;
  isUsed: boolean;
}

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [activeTab, setActiveTab] = useState<'general' | 'designations' | 'permissions' | 'security'>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  // General Settings State
  const [companyName, setCompanyName] = useState('');
  const [companyCreatedAt, setCompanyCreatedAt] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Designations State
  const [designations, setDesignations] = useState<DesignationItem[]>([]);
  const [newDesignation, setNewDesignation] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSettingsAndDesignations = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [settingsRes, desigRes] = await Promise.all([
        fetch(`/api/companies/${companySlug}/settings`),
        fetch(`/api/companies/${companySlug}/designations`),
      ]);

      if (settingsRes.status === 403 || desigRes.status === 403) {
        setIsForbidden(true);
        setIsLoading(false);
        return;
      }

      const settingsData = await settingsRes.json();
      const desigData = await desigRes.json();

      if (settingsData.success && settingsData.company) {
        setCompanyName(settingsData.company.name || '');
        setCompanyCreatedAt(settingsData.company.created_at || '');
        if (settingsData.company.logo_url) {
          setLogoPreview(settingsData.company.logo_url);
        }
      }

      if (desigData.success && desigData.designations) {
        setDesignations(desigData.designations);
      }

      const cacheKey = `settings_${companySlug}`;
      setCachedData(cacheKey, {
        company: settingsData.company,
        designations: desigData.designations || [],
      }, 60 * 1000);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setFeedback({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      const cacheKey = `settings_${companySlug}`;
      const cached = getCachedData<any>(cacheKey);
      if (cached) {
        if (cached.company) {
          setCompanyName(cached.company.name || '');
          setCompanyCreatedAt(cached.company.created_at || '');
          if (cached.company.logo_url) setLogoPreview(cached.company.logo_url);
        }
        if (cached.designations) setDesignations(cached.designations);
        setIsLoading(false);
        fetchSettingsAndDesignations(true);
      } else {
        fetchSettingsAndDesignations(false);
      }
    }
  }, [companySlug]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: companyName.trim(),
          logo_url: logoPreview || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update workspace name');

      setFeedback({ type: 'success', message: 'Workspace logo and profile updated successfully.' });
      router.refresh();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save changes.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('Only PNG, JPG, GIF, and WEBP image files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be 5MB or less.');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setFeedback({ type: 'success', message: `Selected logo "${file.name}". Ready to apply.` });
  };

  const handleAddDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesignation.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/designations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDesignation.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add designation');

      setDesignations((prev) => [...prev, data.designation]);
      setNewDesignation('');
      setFeedback({ type: 'success', message: `Designation "${data.designation.name}" added.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error adding designation.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDesignation = async (item: DesignationItem) => {
    if (item.isUsed) {
      alert(`Cannot delete "${item.name}". It is assigned to active team members.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete unused designation "${item.name}"?`)) {
      return;
    }

    setDeletingId(item.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/designations/${item.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete designation');

      setDesignations((prev) => prev.filter((d) => d.id !== item.id));
      setFeedback({ type: 'success', message: data.message || 'Designation deleted.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error deleting designation.' });
    } finally {
      setDeletingId(null);
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
          Company Settings and Designation management are strictly restricted to Workspace Administrators.
        </p>
        <Link
          href={`/c/${companySlug}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Workspace</span>
        </Link>
      </div>
    );
  }

  if (isLoading && !companyName && designations.length === 0) {
    return <CenterLoader message="Loading company settings..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Settings className="w-3.5 h-3.5" />
            Administration
          </span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">Company Settings</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Manage workspace branding, employee designations, security protocols, and tenant permissions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>General</span>
        </button>
        <button
          onClick={() => setActiveTab('designations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'designations'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Designations ({designations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'permissions'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Permissions</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security</span>
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-white text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveGeneral}
            className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-6 shadow-xl"
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Workspace Profile & Identity</span>
            </h3>

            {/* Logo Upload Section */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">Workspace Brand Logo</label>
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Company Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Layers className="w-8 h-8 text-indigo-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                    </button>
                    {logoFile && (
                      <span className="text-[11px] text-emerald-400 font-mono">
                        {logoFile.name} ({(logoFile.size / 1024).toFixed(0)} KB)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Recommended dimensions: 256x256 PNG or SVG. Max file size: 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Organization Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">Organization Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Workspace Identifier / Subdomain */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">Workspace Slug</label>
              <input
                type="text"
                disabled
                value={companySlug}
                className="w-full px-3.5 py-2.5 bg-zinc-950/40 border border-zinc-800/60 rounded-xl text-xs text-zinc-500 font-mono cursor-not-allowed"
              />
              <p className="text-[11px] text-zinc-500">
                Workspace URL: <span className="font-mono text-indigo-400">https://adsetsproflow.com/c/{companySlug}</span>
              </p>
            </div>

            {companyCreatedAt && (
              <p className="text-[11px] text-zinc-500">
                Created on: <span className="text-zinc-400 font-mono">{formatDate(companyCreatedAt, 'short')}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !companyName.trim()}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer transition-colors"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: DESIGNATIONS MANAGEMENT */}
      {activeTab === 'designations' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-400" />
                  <span>Job Designations & Roles</span>
                </h3>
                <p className="text-xs text-zinc-400 pt-0.5">
                  Define official employee roles for assignment dropdowns and performance audits
                </p>
              </div>
            </div>

            {/* Add Designation Form */}
            <form onSubmit={handleAddDesignation} className="flex gap-2.5">
              <input
                type="text"
                required
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                placeholder="e.g. Lead Product Designer, Senior DevOps Engineer..."
                className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newDesignation.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Designation</span>
              </button>
            </form>

            {/* Designations List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Workspace Designations ({designations.length})
              </h4>

              {designations.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-zinc-800 rounded-2xl p-6 text-zinc-500 text-xs">
                  No custom designations configured yet. Add designations using the field above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {designations.map((des) => (
                    <div
                      key={des.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-white block truncate">{des.name}</span>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full border ${
                              des.isUsed
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {des.isUsed ? `${des.employeeCount} assigned` : 'Unused'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteDesignation(des)}
                        disabled={des.isUsed || deletingId === des.id}
                        title={
                          des.isUsed
                            ? 'Cannot delete designation currently in use by team members'
                            : 'Delete unused designation'
                        }
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          des.isUsed
                            ? 'text-zinc-600 cursor-not-allowed opacity-40'
                            : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
                        }`}
                      >
                        {deletingId === des.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Workspace Role & Permissions Hierarchy</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Granular access controls enforce tenant isolation and role-specific operational barriers
            </p>

            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 text-zinc-400 font-semibold border-b border-zinc-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Permission / Action</th>
                    <th className="px-4 py-3.5 text-center">Company Admin</th>
                    <th className="px-4 py-3.5 text-center">Department Head</th>
                    <th className="px-4 py-3.5 text-center">Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  <tr>
                    <td className="px-5 py-3 font-semibold text-white">Create & Assign Tasks</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">✓ (All)</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">✓ (Department)</td>
                    <td className="px-4 py-3 text-center text-zinc-500">—</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-white">Review & Approve Tasks</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">✓ (All)</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">✓ (Department)</td>
                    <td className="px-4 py-3 text-center text-zinc-500">—</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-white">Invite & Onboard Colleagues</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">✓</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">✓</td>
                    <td className="px-4 py-3 text-center text-zinc-500">—</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-white">Manage Designations & Settings</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">✓</td>
                    <td className="px-4 py-3 text-center text-zinc-500">—</td>
                    <td className="px-4 py-3 text-center text-zinc-500">—</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-white">Export Operational CSV Audits</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">✓</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">✓</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-white">Delete File Attachments</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">✓ (All)</td>
                    <td className="px-4 py-3 text-center text-amber-400 font-bold">Uploader Only</td>
                    <td className="px-4 py-3 text-center text-amber-400 font-bold">Uploader Only</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY PROTOCOLS */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-Tenant Security Architecture</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Private Storage Isolation</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  All task assets and avatar uploads reside in strictly private buckets (<code className="text-indigo-400 font-mono text-[11px]">task-attachments</code>, <code className="text-indigo-400 font-mono text-[11px]">profile-avatars</code>). Raw storage paths are never leaked to client browsers.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Lock className="w-4 h-4" />
                  <span>60-Second Signed Download URLs</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  File downloads generate secure, ephemeral HMAC signatures valid for exactly 60 seconds. Links cannot be scraped or shared outside authenticated tenant sessions.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                  <FileCheck className="w-4 h-4" />
                  <span>Immutable Activity Auditing</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every task creation, status transition, review decision, attachment addition, and deletion is recorded in <code className="text-indigo-400 font-mono text-[11px]">task_activities</code>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                  <Shield className="w-4 h-4" />
                  <span>Row-Level & Tenant Guard</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  All requests validate company status, active tenant membership, and role permissions server-side before querying or mutating data.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
