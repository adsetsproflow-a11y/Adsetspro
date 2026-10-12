'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Plus,
  Clock,
  Play,
  Square,
  MessageSquare,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  UploadCloud,
  Check,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, TaskStatus, TaskPriority, Department, UserProfile } from '@/lib/types';
import { saasStore } from '@/lib/storage';
import { audioEngine } from '@/lib/audio';

interface TaskTableProps {
  onOpenCreateTask: () => void;
  onOpenTaskDiscussion: (task: Task) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  onOpenCreateTask,
  onOpenTaskDiscussion,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeUser, setActiveUser] = useState<UserProfile>(saasStore.getActiveUser());

  const fileInputRefs = useRef<{ [taskId: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    setCurrentTime(Date.now());
    const update = () => {
      setTasks(saasStore.getCompanyTasks());
      setProfiles(saasStore.getProfiles());
      setActiveUser(saasStore.getActiveUser());
    };
    update();
    const unsub = saasStore.subscribe(update);

    // Timer tick every second
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      saasStore.incrementActiveTimers();
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    if (newStatus === 'completed' && task.status !== 'completed') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
        });
      } catch (e) {
        console.error('Confetti error:', e);
      }
    }
    saasStore.updateTaskStatus(task.id, newStatus);
  };

  const handleToggleTimer = (taskId: string) => {
    saasStore.toggleTaskTimer(taskId);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      saasStore.deleteTask(taskId);
    }
  };

  const handleQuickDeliverableUpload = (taskId: string, file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      alert('Please upload an image file (.png, .jpg, .jpeg, .webp)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const origKb = Math.round(file.size / 1024);
              const wKb = Math.round(blob.size / 1024);
              const saved = origKb > 0 ? (((origKb - wKb) / origKb) * 100).toFixed(1) : '0';
              const webpUrl = URL.createObjectURL(blob);
              const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

              saasStore.attachDeliverableToTask(taskId, {
                uploaded_by: activeUser.id,
                original_name: file.name,
                webp_name: `${baseName}.webp`,
                webp_url: webpUrl,
                original_url: dataUrl,
                original_size_kb: origKb,
                webp_size_kb: wKb,
                savings_percentage: parseFloat(saved),
              });

              // Automatically set task status to Under Review
              saasStore.updateTaskStatus(taskId, 'review');
              audioEngine.playSuccessChime();

              try {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.7 },
                  colors: ['#10b981', '#6366f1'],
                });
              } catch (_) {}
            }
          },
          'image/webp',
          0.85
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const formatTimer = (totalSeconds: number = 0) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? hours + 'h ' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDeadlineInfo = (dueDateStr: string, isCompleted: boolean) => {
    if (isCompleted) {
      return { text: 'Completed', isUrgent: false, isOverdue: false };
    }
    if (currentTime === 0) {
      return { text: 'Loading countdown...', isUrgent: false, isOverdue: false };
    }
    const dueTime = new Date(dueDateStr).getTime();
    const diff = dueTime - currentTime;

    if (diff < 0) {
      const overdueMins = Math.abs(Math.floor(diff / 60000));
      const hours = Math.floor(overdueMins / 60);
      const mins = overdueMins % 60;
      return {
        text: `Overdue by ${hours > 0 ? hours + 'h ' : ''}${mins}m`,
        isUrgent: true,
        isOverdue: true,
      };
    }

    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const isUrgent = totalMinutes <= 60;

    return {
      text: `${hours > 0 ? hours + 'h ' : ''}${mins}m remaining`,
      isUrgent,
      isOverdue: false,
    };
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || t.department === deptFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchesSearch && matchesDept && matchesStatus && matchesPriority;
  });

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            Low
          </span>
        );
    }
  };

  const getDepartmentBadge = (dept: Department) => {
    switch (dept) {
      case 'Design':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300">
            🎨 Design
          </span>
        );
      case 'Development':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
            💻 Dev
          </span>
        );
      case 'Content':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
            ✍️ Content
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, deliverables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="Design">🎨 Design</option>
            <option value="Development">💻 Development</option>
            <option value="Content">✍️ Content</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Under Review</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🔵 Medium</option>
            <option value="low">⚪ Low</option>
          </select>

          {/* Add Task Button */}
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer ml-auto md:ml-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Zoho-Style Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/75 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="py-3 px-4">Task & Hierarchy</th>
                <th className="py-3 px-4">Assignee & Assigner</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Deadline & Countdown</th>
                <th className="py-3 px-4">Status Pipeline</th>
                <th className="py-3 px-4">Employee Deliverables & Assigner Download</th>
                <th className="py-3 px-4">Timer</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    No tasks match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const assignee = profiles.find((p) => p.id === task.assigned_to);
                  const assigner = profiles.find((p) => p.id === task.created_by);
                  const deadlineInfo = getDeadlineInfo(task.due_date, task.status === 'completed');

                  return (
                    <tr
                      key={task.id}
                      className={`group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        deadlineInfo.isOverdue
                          ? 'bg-red-50/30 dark:bg-red-950/20 border-l-4 border-l-red-500'
                          : deadlineInfo.isUrgent
                          ? 'bg-amber-50/30 dark:bg-amber-950/20 border-l-4 border-l-amber-500'
                          : ''
                      }`}
                    >
                      {/* Task Title & Department Badge */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {getDepartmentBadge(task.department)}
                            <span
                              className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                              onClick={() => onOpenTaskDiscussion(task)}
                            >
                              {task.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>+{task.reward_xp} XP on completion</span>
                          </div>
                        </div>
                      </td>

                      {/* Assignee & Assigner Badges */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {/* Worker assigned */}
                          {assignee ? (
                            <div className="flex items-center gap-1.5">
                              <img
                                src={assignee.avatar_url}
                                alt={assignee.full_name}
                                className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-300 dark:ring-zinc-700"
                              />
                              <div>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  {assignee.full_name}
                                </span>
                                <span className="text-[10px] text-zinc-400 ml-1">
                                  ({assignee.department})
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic">Unassigned</span>
                          )}

                          {/* Assigner / Creator */}
                          {assigner && (
                            <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                              <span className="font-medium">Assigned by:</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                {assigner.full_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Priority Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getPriorityBadge(task.priority)}
                      </td>

                      {/* Deadline Countdown & Alarm */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-xs ${
                              deadlineInfo.isOverdue
                                ? 'text-red-600 dark:text-red-400 alarm-pulse-urgent px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/80 font-bold'
                                : deadlineInfo.isUrgent
                                ? 'text-amber-600 dark:text-amber-400 alarm-pulse-warning px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 font-bold'
                                : 'text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {deadlineInfo.text}
                          </span>
                          <span className="text-[10px] text-zinc-400 mt-0.5">
                            Due {new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none transition-colors ${
                            task.status === 'completed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : task.status === 'in_progress'
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                              : task.status === 'review'
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Under Review 🔍</option>
                          <option value="completed">Completed 🏆</option>
                        </select>
                      </td>

                      {/* Deliverables (.webp Thumbnails + One-Click Assigner Download + Upload Button) */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-2">
                          {/* Attached Deliverables with Assigner Download */}
                          {task.attachments && task.attachments.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {task.attachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="border border-emerald-500/30 dark:border-emerald-700/40 rounded-lg p-1.5 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center gap-2 shadow-xs"
                                >
                                  <img
                                    src={att.webp_url}
                                    alt={att.webp_name}
                                    className="w-8 h-8 rounded-md object-cover ring-1 ring-emerald-500/30"
                                  />
                                  <div className="text-[10px]">
                                    <div className="font-bold text-emerald-700 dark:text-emerald-300">
                                      {att.webp_size_kb} KB (-{att.savings_percentage}%)
                                    </div>
                                    <div className="text-zinc-400 truncate max-w-28 text-[9px]">
                                      {att.webp_name}
                                    </div>
                                  </div>

                                  {/* Download Buttons for the person who assigned the task */}
                                  <div className="flex items-center gap-1 border-l border-emerald-200 dark:border-emerald-800 pl-1.5">
                                    <a
                                      href={att.webp_url}
                                      download={att.webp_name}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Download WebP Deliverable (Optimized)"
                                      className="flex items-center gap-0.5 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>WebP</span>
                                    </a>
                                    {att.original_url && (
                                      <a
                                        href={att.original_url}
                                        download={att.original_name}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Download RAW Original File (PNG/JPG)"
                                        className="px-1.5 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-[9px] font-bold cursor-pointer"
                                      >
                                        RAW
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick Upload Button for Employee Finishing Task */}
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, image/webp"
                              ref={(el) => {
                                fileInputRefs.current[task.id] = el;
                              }}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleQuickDeliverableUpload(task.id, e.target.files[0]);
                                  e.target.value = '';
                                }
                              }}
                              className="hidden"
                            />
                            <button
                              onClick={() => fileInputRefs.current[task.id]?.click()}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Upload finished deliverable image (auto-converted to WebP)"
                            >
                              <UploadCloud className="w-3 h-3" />
                              <span>{task.attachments && task.attachments.length > 0 ? '+ Upload Another' : '📷 Upload Deliverable'}</span>
                            </button>

                            {/* Assigner Review Approval Button */}
                            {task.status === 'review' && (
                              <button
                                onClick={() => handleStatusChange(task, 'completed')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                                title="Approve deliverable and award XP points"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve Deliverable</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Timer */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleTimer(task.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              task.is_timer_running
                                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                            title={task.is_timer_running ? 'Pause Timer' : 'Start Timer'}
                          >
                            {task.is_timer_running ? (
                              <Square className="w-3 h-3 fill-current" />
                            ) : (
                              <Play className="w-3 h-3 fill-current" />
                            )}
                          </button>
                          <span className={`font-mono text-xs ${task.is_timer_running ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500'}`}>
                            {formatTimer(task.time_spent_seconds)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenTaskDiscussion(task)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Open Task Discussion Drawer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
