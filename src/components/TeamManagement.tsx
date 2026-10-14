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
  Code2,
  Palette,
  TrendingUp,
  FlaskConical,
  PenTool,
  BadgeCheck,
  Copy,
  KeyRound,
  IdCard,
} from 'lucide-react';
import { UserProfile, Department, Role, Designation, Task } from '@/lib/types';
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
  const [designationFilter, setDesignationFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newlyCreatedEmployee, setNewlyCreatedEmployee] = useState<UserProfile | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState<Designation>('Developer');
  const [department, setDepartment] = useState<Department>('Development');
  const [role, setRole] = useState<Role>('worker');
  const [password, setPassword] = useState('admin123');
  const [createdPassword, setCreatedPassword] = useState('admin123');
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

  // Sync department automatically when designation changes
  const handleDesignationSelect = (desig: Designation) => {
    setDesignation(desig);
    if (desig === 'Developer') setDepartment('Development');
    else if (desig === 'Designer') setDepartment('Design');
    else if (desig === 'Digital Marketer') setDepartment('Marketing');
    else if (desig === 'Tester') setDepartment('QA');
    else if (desig === 'Content Writer') setDepartment('Content');
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !email.trim()) {
      setError('Please provide full name and email.');
      return;
    }

    setLoading(true);
    const assignedPass = password || 'admin123';
    const res = await authService.addEmployee({
      companyId: activeCompany.id,
      fullName: fullName.trim(),
      email: email.trim(),
      password: assignedPass,
      designation,
      department,
      role,
    });
    setLoading(false);

    if (!res.success || !res.user) {
      setError(res.error || 'Failed to add employee');
      return;
    }

    // Play success chime and show confirmation modal with auto-generated Employee ID
    audioEngine.playSuccessChime();
    setCreatedPassword(assignedPass);
    setNewlyCreatedEmployee(res.user);
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

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(true);
      audioEngine.playBellChime();
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const filteredEmployees = profiles.filter((p) => {
    const matchSearch =
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.employee_id && p.employee_id.toLowerCase().includes(search.toLowerCase())) ||
      (p.designation && p.designation.toLowerCase().includes(search.toLowerCase()));

    const matchDesignation =
      designationFilter === 'all' || p.designation === designationFilter;

    const matchDept = deptFilter === 'all' || p.department === deptFilter;

    return matchSearch && matchDesignation && matchDept;
  });

  const isCompanyAdminOrSuperAdmin =
    activeUser.role === 'company_admin' || activeUser.role === 'super_admin';

  const getDesignationBadge = (des?: Designation) => {
    switch (des) {
      case 'Developer':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Code2 className="w-3 h-3" />
            Developer
          </span>
        );
      case 'Designer':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Palette className="w-3 h-3" />
            Designer
          </span>
        );
      case 'Digital Marketer':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <TrendingUp className="w-3 h-3" />
            Digital Marketer
          </span>
        );
      case 'Tester':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <FlaskConical className="w-3 h-3" />
            QA Tester
          </span>
        );
      case 'Content Writer':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <PenTool className="w-3 h-3" />
            Content Writer
          </span>
        );
      case 'Company CEO':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Shield className="w-3 h-3" />
            Company CEO
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Briefcase className="w-3 h-3" />
            {des || 'Member'}
          </span>
        );
    }
  };

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
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>{activeCompany.name} Admin Panel</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40">
                  Employee Directory
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Company Admin & CEO portal to onboard staff, configure designations (Developer, Designer, Tester, Digital Marketer, Content Writer), and assign Employee IDs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Total Team Members: {profiles.length}
            </div>
            <div className="text-[10px] text-zinc-400">
              Workspace: <span className="font-mono text-indigo-500 font-bold">/workspace/{activeCompany.subdomain}</span>
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

      {/* Designation Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(
          [
            { title: 'Developers', role: 'Developer', icon: Code2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { title: 'Designers', role: 'Designer', icon: Palette, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { title: 'Marketers', role: 'Digital Marketer', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { title: 'Testers (QA)', role: 'Tester', icon: FlaskConical, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { title: 'Writers', role: 'Content Writer', icon: PenTool, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          ] as const
        ).map((item) => {
          const count = profiles.filter((p) => p.designation === item.role).length;
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={() =>
                setDesignationFilter(designationFilter === item.role ? 'all' : item.role)
              }
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                designationFilter === item.role
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                  {item.title}
                </span>
                <div className={`w-6 h-6 rounded-lg ${item.bg} flex items-center justify-center ${item.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                {count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
              Designation:
            </span>
            <select
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Designations</option>
              <option value="Developer">💻 Developer</option>
              <option value="Designer">🎨 Designer</option>
              <option value="Digital Marketer">📈 Digital Marketer</option>
              <option value="Tester">🧪 QA Tester</option>
              <option value="Content Writer">✍️ Content Writer</option>
              <option value="Company CEO">👑 Company CEO</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
              Dept:
            </span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Departments</option>
              <option value="Development">💻 Development</option>
              <option value="Design">🎨 Design</option>
              <option value="Marketing">📈 Marketing</option>
              <option value="QA">🧪 QA Testing</option>
              <option value="Content">✍️ Content</option>
            </select>
          </div>
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
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-xs group relative overflow-hidden"
            >
              <div>
                {/* Header with Avatar and ID */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar_url}
                      alt={emp.full_name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                          {emp.full_name}
                        </h3>
                        {emp.id === activeUser.id && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {emp.employee_id || `EMP-${emp.id.slice(-4).toUpperCase()}`}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono truncate max-w-[120px]">
                          {emp.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isCompanyAdminOrSuperAdmin && emp.id !== activeUser.id && (
                    <button
                      onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Remove employee from company"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Designation and Role Badges */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {getDesignationBadge(emp.designation)}

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      emp.role === 'company_admin'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        : emp.role === 'team_lead'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {emp.role.replace('_', ' ')}
                  </span>
                </div>

                {/* Task Stats */}
                <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-2.5 text-center mb-4">
                  <div>
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">
                      In Flight Tasks
                    </div>
                    <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                      {activeTaskCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">
                      Deliverables Sent
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

      {/* Confirmation Modal for newly created employee with auto-generated Employee ID */}
      {newlyCreatedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setNewlyCreatedEmployee(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center mb-5">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Employee Registered Successfully!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                An account and employee credentials have been generated for {activeCompany.name}.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Employee ID:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  {newlyCreatedEmployee.employee_id}
                  <button
                    onClick={() => copyToClipboard(newlyCreatedEmployee.employee_id || '')}
                    className="hover:opacity-75 cursor-pointer text-zinc-400"
                    title="Copy Employee ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Full Name:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {newlyCreatedEmployee.full_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Designation:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {newlyCreatedEmployee.designation}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Login Email:</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">
                  {newlyCreatedEmployee.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Initial Password:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {createdPassword}
                </span>
              </div>
            </div>

            {/* 1-Click Copy Full Credentials Button */}
            <button
              onClick={() => {
                const workspaceUrl = typeof window !== 'undefined'
                  ? `${window.location.origin}/workspace/${activeCompany.subdomain}`
                  : `http://localhost:3000/workspace/${activeCompany.subdomain}`;
                copyToClipboard(
                  `Employee Credentials:\nWorkspace URL: ${workspaceUrl}\nEmail: ${newlyCreatedEmployee.email}\nPassword: ${createdPassword}\nDesignation: ${newlyCreatedEmployee.designation}`
                );
              }}
              className="mt-3 w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold border border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copy Full Credentials (URL + Email + Password)</span>
            </button>

            {copiedId && (
              <p className="text-[11px] text-center text-emerald-500 font-bold mt-2">
                ✓ Full credentials copied to clipboard!
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  saasStore.setActiveUserId(newlyCreatedEmployee.id);
                  setNewlyCreatedEmployee(null);
                  audioEngine.playSuccessChime();
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Switch to this User Now
              </button>
              <button
                onClick={() => setNewlyCreatedEmployee(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Onboard Employee (Admin Panel)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Add member to {activeCompany.name} • Employee ID generated automatically
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
                  placeholder="e.g. Ramesh Kumar"
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
                  placeholder={`ramesh@${activeCompany.subdomain}.agency`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Designation Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Designation / Specialty
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'Developer', label: '💻 Developer', dept: 'Development' },
                      { id: 'Designer', label: '🎨 Designer', dept: 'Design' },
                      { id: 'Digital Marketer', label: '📈 Digital Marketer', dept: 'Marketing' },
                      { id: 'Tester', label: '🧪 QA Tester', dept: 'QA' },
                      { id: 'Content Writer', label: '✍️ Content Writer', dept: 'Content' },
                      { id: 'Product Manager', label: '📋 Product Manager', dept: 'Development' },
                    ] as const
                  ).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleDesignationSelect(d.id as Designation)}
                      className={`px-3 py-2 text-left rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        designation === d.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
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
                    <option value="Marketing">📈 Marketing</option>
                    <option value="QA">🧪 QA Testing</option>
                    <option value="Content">✍️ Content</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Permission Role
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
                  {loading ? 'Generating Employee ID & Account...' : 'Confirm & Generate Employee ID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
