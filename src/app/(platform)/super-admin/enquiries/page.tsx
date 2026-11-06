'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  Sparkles,
  Shield,
  Layers,
  Lock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dateFormat';

interface DemoLead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string | null;
  unlocked_role: string | null;
  ip_address: string | null;
  status: string;
  synced_to_sheets: boolean;
  created_at: string;
}

interface CompanyRegistration {
  id: string;
  company_name: string;
  company_slug: string | null;
  company_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  is_company_active: boolean;
  current_company_status: string | null;
}

export default function SuperAdminEnquiriesPage() {
  const [activeTab, setActiveTab] = useState<'registrations' | 'leads'>('registrations');
  const [leads, setLeads] = useState<DemoLead[]>([]);
  const [registrations, setRegistrations] = useState<CompanyRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (searchQuery.trim()) q.set('search', searchQuery.trim());
      if (statusFilter !== 'all') q.set('status', statusFilter);

      const res = await fetch(`/api/super-admin/registrations?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      console.error('Failed to fetch company registrations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (searchQuery.trim()) q.set('search', searchQuery.trim());
      if (statusFilter !== 'all') q.set('status', statusFilter);

      const res = await fetch(`/api/demo/request-access?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to fetch demo leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'registrations') {
      fetchRegistrations();
    } else {
      fetchLeads();
    }
  }, [activeTab, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'registrations') {
      fetchRegistrations();
    } else {
      fetchLeads();
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setIsUpdatingId(leadId);
    try {
      const res = await fetch('/api/demo/request-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
      }
    } catch (err) {
      console.error('Error updating lead status:', err);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this enquiry record?')) return;
    try {
      const res = await fetch(`/api/demo/request-access?id=${leadId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        try {
          if (localStorage.getItem('demo_lead_id') === leadId) {
            localStorage.removeItem('demo_access_unlocked');
            localStorage.removeItem('demo_lead_name');
            localStorage.removeItem('demo_lead_id');
            document.cookie = 'demo_access_unlocked=; Max-Age=0; path=/;';
          }
        } catch {}
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportToCSV = () => {
    if (activeTab === 'registrations') {
      if (registrations.length === 0) return;
      const headers = ['Company Name', 'Workspace Slug', 'Administrator Name', 'Work Email', 'Phone Number', 'Status', 'Registered At'];
      const rows = registrations.map((r) => [
        `"${r.company_name}"`,
        `"${r.company_slug || ''}"`,
        `"${r.full_name}"`,
        `"${r.email}"`,
        `"${r.phone}"`,
        `"${r.status}"`,
        `"${new Date(r.created_at).toLocaleString()}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Company_Registrations_Archive_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (leads.length === 0) return;
      const headers = ['Full Name', 'Email', 'Phone', 'Company Name', 'Requested Role', 'Status', 'Created At', 'IP Address'];
      const rows = leads.map((l) => [
        `"${l.full_name}"`,
        `"${l.email}"`,
        `"${l.phone}"`,
        `"${l.company_name || 'N/A'}"`,
        `"${l.unlocked_role || 'All'}"`,
        `"${l.status || 'new'}"`,
        `"${new Date(l.created_at).toLocaleString()}"`,
        `"${l.ip_address || ''}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Demo_Enquiries_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Audited User Acquisition & Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            User Requests & Registrations
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Authoritative registry of company applicants and demo leads with verified Indian phone numbers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCSV}
            disabled={activeTab === 'registrations' ? registrations.length === 0 : leads.length === 0}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => (activeTab === 'registrations' ? fetchRegistrations() : fetchLeads())}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Mode / Tabs Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => {
            setActiveTab('registrations');
            setSearchQuery('');
            setStatusFilter('all');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'registrations'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Company Registration Archive</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {registrations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('leads');
            setSearchQuery('');
            setStatusFilter('all');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'leads'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Demo Sandbox Leads</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {leads.length}
          </span>
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            {activeTab === 'registrations' ? 'Company Registrations' : 'Total Leads'}
          </span>
          <p className="text-2xl font-black text-white">
            {activeTab === 'registrations' ? registrations.length : leads.length}
          </p>
          <p className="text-[10px] text-zinc-500">
            {activeTab === 'registrations' ? 'Permanent archive records' : 'All demo inquiries'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Verified Phone Numbers
          </span>
          <p className="text-2xl font-black text-emerald-300">100%</p>
          <p className="text-[10px] text-emerald-400/80">Valid 10-digit format</p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
            Data Preservation
          </span>
          <p className="text-2xl font-black text-indigo-300">Permanent</p>
          <p className="text-[10px] text-indigo-400/80">Retained even if workspace purged</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-md space-y-1">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            Quick Actions
          </span>
          <p className="text-sm font-bold text-amber-300 pt-1">Direct Call &amp; WhatsApp</p>
          <p className="text-[10px] text-amber-400/80">Clickable communication links</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'registrations'
                ? 'Search by company name, applicant, email, or phone...'
                : 'Search demo inquiries by name, email, phone, or company...'
            }
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            {activeTab === 'leads' && (
              <>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Main Content Table */}
      {activeTab === 'registrations' ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Company Registration Archive (Permanent Registry)</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                🔒 Immutable applicant records and phone numbers. Never deleted even if the company workspace or user account is purged.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {registrations.length} record{registrations.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">Company / Workspace</th>
                  <th className="pb-3">Applicant Name</th>
                  <th className="pb-3">Work Email</th>
                  <th className="pb-3">Phone Number</th>
                  <th className="pb-3">Registration Status</th>
                  <th className="pb-3">Registered At</th>
                  <th className="pb-3 text-right pr-2">Quick Outreach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {registrations && registrations.length > 0 ? (
                  registrations.map((reg) => {
                    const rawDigits = reg.phone.replace(/\D/g, '');
                    return (
                      <tr key={reg.id} className="hover:bg-zinc-900/40 transition-colors">
                        {/* Company Name & Slug */}
                        <td className="py-3.5 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {reg.company_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{reg.company_name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {reg.company_slug && (
                                  <span className="font-mono text-[10px] text-zinc-400">
                                    /c/{reg.company_slug}
                                  </span>
                                )}
                                {!reg.is_company_active && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                    Workspace Purged
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Applicant Name */}
                        <td className="py-3.5">
                          <span className="font-semibold text-zinc-200">{reg.full_name}</span>
                        </td>

                        {/* Email */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <a
                              href={`mailto:${reg.email}`}
                              className="font-mono text-indigo-400 hover:text-indigo-300 hover:underline text-[11px]"
                            >
                              {reg.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(reg.email, `reg_email_${reg.id}`)}
                              className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Copy Email"
                            >
                              {copiedId === `reg_email_${reg.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${reg.phone.replace(/\s+/g, '')}`}
                              className="font-mono text-emerald-400 font-bold hover:underline text-[11px] flex items-center gap-1"
                              title="Call applicant"
                            >
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{reg.phone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(reg.phone, `reg_phone_${reg.id}`)}
                              className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Copy Phone"
                            >
                              {copiedId === `reg_phone_${reg.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              reg.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : reg.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {reg.status}
                          </span>
                        </td>

                        {/* Registered At */}
                        <td className="py-3.5 text-zinc-400 font-mono text-[11px]">
                          {formatDate(reg.created_at, 'medium')}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 text-right pr-2">
                          <div className="flex items-center justify-end gap-2">
                            {rawDigits.length >= 10 && (
                              <a
                                href={`https://wa.me/${rawDigits}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                                title="Message on WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <a
                              href={`tel:${reg.phone.replace(/\s+/g, '')}`}
                              className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-zinc-500">
                      No company registrations found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Demo Leads Table */
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">Prospect / Contact</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Phone Number</th>
                  <th className="pb-3">Requested Demo</th>
                  <th className="pb-3">Submitted At</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {leads && leads.length > 0 ? (
                  leads.map((lead) => {
                    const rawPhoneDigits = lead.phone.replace(/\D/g, '');
                    return (
                      <tr key={lead.id} className="hover:bg-zinc-900/40 transition-colors">
                        {/* Name & Company */}
                        <td className="py-3.5 pl-2 max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {lead.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{lead.full_name}</p>
                              <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-zinc-500" />
                                <span>{lead.company_name || 'Independent / Individual'}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <a
                              href={`mailto:${lead.email}`}
                              className="font-mono text-indigo-400 hover:text-indigo-300 hover:underline text-[11px]"
                            >
                              {lead.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(lead.email, `email_${lead.id}`)}
                              className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Copy Email"
                            >
                              {copiedId === `email_${lead.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <span className="inline-block mt-0.5 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                            Valid Email
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${lead.phone}`}
                              className="font-mono text-zinc-200 font-semibold hover:text-indigo-400 transition-colors text-[11px]"
                            >
                              {lead.phone}
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(lead.phone, `phone_${lead.id}`)}
                              className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Copy Phone"
                            >
                              {copiedId === `phone_${lead.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {rawPhoneDigits.length >= 10 && (
                              <a
                                href={`https://wa.me/${rawPhoneDigits}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                                title="Message on WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Requested Demo Role */}
                        <td className="py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                            {lead.unlocked_role || 'All Roles'}
                          </span>
                        </td>

                        {/* Submitted At */}
                        <td className="py-3.5 text-zinc-400 font-mono text-[11px]">
                          {formatDate(lead.created_at, 'medium')}
                        </td>

                        {/* Status Selector */}
                        <td className="py-3.5 text-center">
                          <select
                            value={lead.status || 'new'}
                            disabled={isUpdatingId === lead.id}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none ${
                              lead.status === 'contacted'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : lead.status === 'qualified'
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            }`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 text-right pr-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-zinc-500">
                      No demo enquiries found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
