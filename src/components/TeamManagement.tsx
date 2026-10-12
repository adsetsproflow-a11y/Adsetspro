'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Briefcase,
  Flame,
  Zap,
  Trash2,
  Plus,
  CheckCircle2,
  X,
  Search,
  Check,
  Send,
  Building2,
} from 'lucide-react';
import { UserProfile, Department, Role, Task } from '@/lib/types';
import { saasStore } from '@/lib/storage';
import { authService } from '@/lib/auth';
import { audioEngine } from '@/lib/audio';

interface TeamManagementProps {
  onAssignTaskToEmployee: (employeeId: string) => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ onAssignTaskToEmployee }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeCompany, setActiveCompany] = useState(saasStore.getActiveCompany());
  const [activeUser, setActiveUser] = useState(saasStore.getActiveUser());
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState<Department>('Development');
  const [role, setRole] = useState<Role>('worker');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const update = () => {
      setActiveCompany(saasStore.getActiveCompany());
      setActiveUser(saasStore.getActiveUser());
      setProfiles(saasStore.getCompanyProfiles());
      setTasks(saasStore.getCompanyTasks());
    };
    update();
    const unsub = saasStore.subscribe(update);
    return unsub;
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !email.trim()) {
      setError('Please provide full name and email.');
      return;
    }

    setLoading(true);
    const res = await authService.addEmployee({
      companyId: activeCompany.id,
      fullName: fullName.trim(),
      email: email.trim(),
      password: password || 'admin123',
      department,
      role,
    });
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to add employee');
      return;
    }

    // Play chime and reset
    audioEngine.playSuccessChime();
    setIsAddModalOpen(false);
    setFullName('');
    setEmail('');
    setPassword('admin123');
  };

  const handleDeleteEmployee = (empId: string, empName: string) => {
    if (empId === activeUser.id) {
      alert('You cannot delete your own active account.');
      return;
    }
    if (confirm(`Are you sure you want to remove ${empName} from ${activeCompany.name}?`)) {
      saasStore.deleteProfile(empId);
      audioEngine.playBellChime();
    }
  };

  const filteredEmployees = profiles.filter((p) => {
    const matchSearch =
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || p.department === deptFilter;
    return matchSearch && matchDept;
  });

  const isCompanyAdminOrSuperAdmin =
    activeUser.role === 'company_admin' || activeUser.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                {activeCompany.name} Team Roster
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Company Admin employee directory, department allocation, and task assignment.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {profiles.length} / {activeCompany.max_users} Seats Used
            </div>
            <div className="text-[10px] text-zinc-400">
              Subdomain: <span className="font-mono text-indigo-500">{activeCompany.subdomain}</span>
            </div>
          </div>

          {isCompanyAdminOrSuperAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search team member by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
            Department:
          </span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="Development">💻 Development</option>
            <option value="Design">🎨 Design</option>
            <option value="Content">✍️ Content</option>
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const empTasks = tasks.filter((t) => t.assigned_to === emp.id);
          const activeTaskCount = empTasks.filter((t) => t.status !== 'completed').length;
          const completedTaskCount = empTasks.filter((t) => t.status === 'completed').length;

          return (
            <div
              key={emp.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-xs group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar_url}
                      alt={emp.full_name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                    />
                    <div>
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        {emp.full_name}
                        {emp.id === activeUser.id && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold uppercase">
                            You
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        {emp.email}
                      </p>
                    </div>
                  </div>

                  {isCompanyAdminOrSuperAdmin && emp.id !== activeUser.id && (
                    <button
                      onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove employee from company"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      emp.role === 'company_admin'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        : emp.role === 'team_lead'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {emp.role.replace('_', ' ')}
                  </span>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                    {emp.department === 'Development'
                      ? '💻 Dev'
                      : emp.department === 'Design'
                      ? '🎨 Design'
                      : '✍️ Content'}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-2.5 text-center mb-4">
                  <div>
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">
                      Active Tasks
                    </div>
                    <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                      {activeTaskCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">
                      Delivered
                    </div>
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {completedTaskCount}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
                  <span className="flex items-center gap-1 font-semibold text-amber-500">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    {emp.current_streak}d streak
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-500">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    {emp.total_xp} XP
                  </span>
                </div>
              </div>

              {/* Bottom Action: Assign Task directly */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => onAssignTaskToEmployee(emp.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign New Task</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Onboard New Employee
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Add member to {activeCompany.name} roster
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleAddEmployee} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kavitha Rajan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder={`kavitha@${activeCompany.subdomain}.agency`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Development">💻 Development</option>
                    <option value="Design">🎨 Design</option>
                    <option value="Content">✍️ Content</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    <option value="worker">👷 Worker / Member</option>
                    <option value="team_lead">👔 Team Lead</option>
                    <option value="company_admin">🏢 Company Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Initial Password (stored hashed)
                </label>
                <input
                  type="password"
                  placeholder="admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Adding Employee...' : 'Confirm & Add to Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
