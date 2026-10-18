'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Server,
  Bell,
  Lock,
  Save,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export default function SuperAdminSettingsPage() {
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(true);
  const [requireManualApproval, setRequireManualApproval] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Settings className="w-3 h-3" />
            System Preferences
          </span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">Platform Settings</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Configure global operational policies, onboarding parameters, and platform branding
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Platform configuration updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Onboarding Policies */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <span>Onboarding & Governance</span>
          </h2>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:border-zinc-700">
              <input
                type="checkbox"
                checked={allowPublicRegistration}
                onChange={(e) => setAllowPublicRegistration(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 text-red-600 focus:ring-red-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white block">
                  Allow Public Company Registration
                </span>
                <span className="text-[11px] text-zinc-400 block">
                  Enable new tenant organizations to register via /register
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:border-zinc-700">
              <input
                type="checkbox"
                checked={requireManualApproval}
                onChange={(e) => setRequireManualApproval(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 text-red-600 focus:ring-red-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white block">
                  Mandate Super Admin Approval
                </span>
                <span className="text-[11px] text-zinc-400 block">
                  Newly registered workspaces remain in "pending" status until approved by root admin
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:border-zinc-700">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 text-red-600 focus:ring-red-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white block">
                  Platform Maintenance Mode
                </span>
                <span className="text-[11px] text-zinc-400 block">
                  Restrict tenant workspace traffic to Super Admins only
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Global Platform Identity */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <span>Platform Branding</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Platform Brand Name</label>
              <input
                type="text"
                defaultValue="Adsetspro Flow"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Public Domain URL</label>
              <input
                type="text"
                defaultValue="https://www.adsetsproflow.com"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
