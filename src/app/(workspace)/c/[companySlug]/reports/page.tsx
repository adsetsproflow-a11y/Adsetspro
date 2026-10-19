'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Download,
  Filter,
  RefreshCw,
  Users,
  Building,
  CheckSquare,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { convertToCSV, downloadCSV } from '@/lib/export/csv';
import CenterLoader from '@/components/common/CenterLoader';
import { getCachedData, setCachedData } from '@/lib/cache/clientCache';

export default function WorkspaceReportsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [activeTab, setActiveTab] = useState<'tasks' | 'employees' | 'departments'>('tasks');
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown options
  const [deptOptions, setDeptOptions] = useState<{ id: string; name: string }[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{ id: string; name: string }[]>([]);

  // Report Data
  const [taskReports, setTaskReports] = useState<any[]>([]);
  const [employeeReports, setEmployeeReports] = useState<any[]>([]);
  const [departmentReports, setDepartmentReports] = useState<any[]>([]);

  const fetchReports = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (selectedDept) q.set('department', selectedDept);
      if (selectedEmployee) q.set('employee', selectedEmployee);
      if (selectedStatus) q.set('status', selectedStatus);
      if (selectedPriority) q.set('priority', selectedPriority);
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);

      const res = await fetch(`/api/companies/${companySlug}/reports?${q.toString()}`);

      if (res.status === 403) {
        setIsForbidden(true);
        setIsLoading(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load reports');
      }

      setDeptOptions(data.filters?.departments || []);
      setEmployeeOptions(data.filters?.employees || []);
      setTaskReports(data.reports?.tasks || []);
      setEmployeeReports(data.reports?.employees || []);
      setDepartmentReports(data.reports?.departments || []);

      // Cache result
      const cacheKey = `reports_${companySlug}_${selectedDept}_${selectedEmployee}_${selectedStatus}_${selectedPriority}_${startDate}_${endDate}`;
      setCachedData(cacheKey, data, 60 * 1000);
    } catch (err: any) {
      console.error('Reports fetch error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      const cacheKey = `reports_${companySlug}_${selectedDept}_${selectedEmployee}_${selectedStatus}_${selectedPriority}_${startDate}_${endDate}`;
      const cached = getCachedData<any>(cacheKey);
      if (cached) {
        setDeptOptions(cached.filters?.departments || []);
        setEmployeeOptions(cached.filters?.employees || []);
        setTaskReports(cached.reports?.tasks || []);
        setEmployeeReports(cached.reports?.employees || []);
        setDepartmentReports(cached.reports?.departments || []);
        setIsLoading(false);
        fetchReports(true);
      } else {
        fetchReports(false);
      }
    }
  }, [companySlug, selectedDept, selectedEmployee, selectedStatus, selectedPriority, startDate, endDate]);

  const handleResetFilters = () => {
    setSelectedDept('');
    setSelectedEmployee('');
    setSelectedStatus('');
    setSelectedPriority('');
    setStartDate('');
    setEndDate('');
  };

  // CSV Export Handlers
  const handleExportTasksCSV = () => {
    const headers = [
      { key: 'title', label: 'Task Title' },
      { key: 'assignee', label: 'Assignee' },
      { key: 'department', label: 'Department' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'completionDate', label: 'Completion Date' },
    ];
    const csv = convertToCSV(taskReports, headers);
    downloadCSV(`task_report_${companySlug}_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const handleExportEmployeesCSV = () => {
    const headers = [
      { key: 'name', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'activeTasks', label: 'Active Tasks' },
      { key: 'completedTasks', label: 'Completed Tasks' },
      { key: 'overdueTasks', label: 'Overdue Tasks' },
    ];
    const csv = convertToCSV(employeeReports, headers);
    downloadCSV(`employee_report_${companySlug}_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const handleExportDepartmentsCSV = () => {
    const headers = [
      { key: 'department', label: 'Department Name' },
      { key: 'head', label: 'Department Head' },
      { key: 'employeeCount', label: 'Employee Count' },
      { key: 'totalTasks', label: 'Total Tasks' },
      { key: 'completionRate', label: 'Completion Rate' },
      { key: 'overdueCount', label: 'Overdue Count' },
    ];
    const csv = convertToCSV(departmentReports, headers);
    downloadCSV(`department_report_${companySlug}_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'submitted_for_review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'revision_required':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
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
          Operational Reports and Auditing exports are restricted to authorized members of this workspace.
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

  if (isLoading && taskReports.length === 0 && employeeReports.length === 0 && departmentReports.length === 0) {
    return <CenterLoader message="Compiling intelligence and audit reports..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <FileText className="w-3.5 h-3.5" />
              Intelligence & Auditing
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Reports & Audits</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Real-time operational reporting with verified SQL queries and one-click CSV data export
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 shrink-0">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'employees'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employees</span>
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'departments'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Departments</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchReports(false)}
            className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* 1. TASK REPORT SECTION */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                Filter Task Deliverables
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={handleExportTasksCSV}
                  disabled={isLoading || taskReports.length === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to CSV ({taskReports.length})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5">
              {/* Department */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Departments</option>
                {deptOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {/* Employee */}
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Employees</option>
                {employeeOptions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted_for_review">Submitted for Review</option>
                <option value="revision_required">Revision Required</option>
                <option value="approved">Approved</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Priority */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              {/* Start Date */}
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Filter Start Date"
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              />

              {/* End Date */}
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="Filter End Date"
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800/80 overflow-hidden shadow-xl">
            {isLoading ? (
              <div className="p-6 space-y-4 animate-pulse">
                <div className="h-5 bg-zinc-800/80 rounded-lg w-1/4" />
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-zinc-800/40 rounded-xl w-full" />
                  ))}
                </div>
              </div>
            ) : taskReports.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <CheckSquare className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">No tasks found matching your criteria</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Adjust your filter dates or status selectors above to see relevant deliverable entries.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Title</th>
                      <th className="px-4 py-3.5">Assignee</th>
                      <th className="px-4 py-3.5">Department</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Priority</th>
                      <th className="px-4 py-3.5">Due Date</th>
                      <th className="px-4 py-3.5">Completion Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {taskReports.map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3 font-semibold text-white max-w-xs truncate">
                          {t.title}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">{t.assignee}</td>
                        <td className="px-4 py-3 text-zinc-400">{t.department}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${getStatusBadge(
                              t.status
                            )}`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${getPriorityBadge(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">{t.dueDate}</td>
                        <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">
                          {t.completionDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. EMPLOYEE REPORT SECTION */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Employee Performance & Workload Audit</span>
            </h3>
            <button
              onClick={handleExportEmployeesCSV}
              disabled={isLoading || employeeReports.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export to CSV ({employeeReports.length})</span>
            </button>
          </div>

          <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800/80 overflow-hidden shadow-xl">
            {isLoading ? (
              <div className="p-6 space-y-4 animate-pulse">
                <div className="h-5 bg-zinc-800/80 rounded-lg w-1/4" />
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-zinc-800/40 rounded-xl w-full" />
                  ))}
                </div>
              </div>
            ) : employeeReports.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Users className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">No employees registered yet</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Invite employees to your workspace to generate employee throughput metrics.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Employee Name</th>
                      <th className="px-4 py-3.5">Department</th>
                      <th className="px-4 py-3.5">Designation</th>
                      <th className="px-4 py-3.5 text-center">Active Tasks</th>
                      <th className="px-4 py-3.5 text-center">Completed Tasks</th>
                      <th className="px-4 py-3.5 text-center">Overdue Tasks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {employeeReports.map((emp) => (
                      <tr key={emp.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3 font-semibold text-white">
                          <div>
                            <span>{emp.name}</span>
                            {emp.email && (
                              <span className="block text-[10px] text-zinc-500 font-mono">
                                {emp.email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-300">{emp.department}</td>
                        <td className="px-4 py-3 text-zinc-400">{emp.designation}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold font-mono text-[11px]">
                            {emp.activeTasks}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono text-[11px]">
                            {emp.completedTasks}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                              emp.overdueTasks > 0
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {emp.overdueTasks}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. DEPARTMENT REPORT SECTION */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Department Throughput & Health Summary</span>
            </h3>
            <button
              onClick={handleExportDepartmentsCSV}
              disabled={isLoading || departmentReports.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export to CSV ({departmentReports.length})</span>
            </button>
          </div>

          <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800/80 overflow-hidden shadow-xl">
            {isLoading ? (
              <div className="p-6 space-y-4 animate-pulse">
                <div className="h-5 bg-zinc-800/80 rounded-lg w-1/4" />
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-zinc-800/40 rounded-xl w-full" />
                  ))}
                </div>
              </div>
            ) : departmentReports.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Building className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">No departments configured yet</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Create functional units and departments to view organizational performance reports.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-4 py-3.5">Department Head</th>
                      <th className="px-4 py-3.5 text-center">Employees</th>
                      <th className="px-4 py-3.5 text-center">Total Tasks</th>
                      <th className="px-4 py-3.5 text-center">Completion Rate</th>
                      <th className="px-4 py-3.5 text-center">Overdue Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {departmentReports.map((d) => (
                      <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3 font-semibold text-white">{d.department}</td>
                        <td className="px-4 py-3 text-zinc-300">{d.head}</td>
                        <td className="px-4 py-3 text-center text-zinc-300 font-mono">{d.employeeCount}</td>
                        <td className="px-4 py-3 text-center text-zinc-300 font-mono">{d.totalTasks}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono text-[11px]">
                            {d.completionRate}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                              d.overdueCount > 0
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {d.overdueCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
