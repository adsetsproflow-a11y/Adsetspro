'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building,
  Plus,
  Users,
  CheckSquare,
  Search,
  RefreshCw,
  X,
  Archive,
  ChevronRight,
  Shield,
  Layers,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface DepartmentItem {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  created_at: string;
  head_user_id: string | null;
  head_name: string;
  head_email: string | null;
  employee_count: number;
  task_count: number;
}

export default function DepartmentsPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;

  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchDepartments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/departments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch departments');
      setDepartments(data.departments || []);
    } catch (err: any) {
      console.error('Failed to load departments:', err);
      setError(err.message || 'Error loading departments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      fetchDepartments();
    }
  }, [companySlug]);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/companies/${companySlug}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeptName.trim(),
          description: newDeptDesc.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create department');

      setIsModalOpen(false);
      setNewDeptName('');
      setNewDeptDesc('');
      fetchDepartments();
    } catch (err: any) {
      setError(err.message || 'Failed to create department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveDepartment = async (e: React.MouseEvent, deptId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to archive this department?')) return;

    setActionLoadingId(deptId);
    try {
      const res = await fetch(`/api/companies/${companySlug}/departments/${deptId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to archive department');
      fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to archive department');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredDepts = departments.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.head_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Building className="w-3 h-3" />
              Organizational Units
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Departments Directory</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Configure company divisions, designate leadership heads, and track department operational capacity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDepartments}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setError(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Department</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search departments by name, leadership head, or description..."
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Department Cards Grid */}
      {filteredDepts.length === 0 && !isLoading ? (
        <div className="py-16 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
          <Building className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Departments Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Get started by organizing your workforce into functional units like Engineering, Marketing, or Product.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
          >
            Create Your First Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepts.map((dept) => (
            <div
              key={dept.id}
              onClick={() => router.push(`/c/${companySlug}/departments/${dept.id}`)}
              className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-indigo-500/40 hover:bg-zinc-900/80 transition-all cursor-pointer flex flex-col justify-between group space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600/20 to-cyan-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      dept.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {dept.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                    {dept.description || 'No division description provided.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-zinc-800/60">
                <div className="text-xs flex items-center justify-between">
                  <span className="text-zinc-500">Department Head:</span>
                  <span className="font-semibold text-zinc-200 truncate max-w-[150px]">
                    {dept.head_name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-bold text-zinc-200">{dept.employee_count}</span>
                    <span className="text-[10px] text-zinc-500">Members</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-bold text-zinc-200">{dept.task_count}</span>
                    <span className="text-[10px] text-zinc-500">Tasks</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-indigo-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                    View Department <ChevronRight className="w-3 h-3" />
                  </span>
                  {dept.status === 'active' && (
                    <button
                      disabled={actionLoadingId === dept.id}
                      onClick={(e) => handleArchiveDepartment(e, dept.id)}
                      className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Archive Department"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Department</h3>
                  <p className="text-xs text-zinc-400">Establish a new organizational division</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Department Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Engineering, Creative Strategy, Growth"
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Description</label>
                <textarea
                  rows={3}
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Brief summary of department responsibilities..."
                  className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
