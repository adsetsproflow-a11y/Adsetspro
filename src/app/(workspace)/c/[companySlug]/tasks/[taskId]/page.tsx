'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckSquare,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  Building,
  Briefcase,
  Play,
  Send,
  CheckCircle2,
  RotateCcw,
  Ban,
  UserPlus,
  Paperclip,
  Download,
  Upload,
  MessageSquare,
  Activity,
  AlertCircle,
  RefreshCw,
  X,
  ShieldCheck,
  FileText,
  Pencil,
  Trash2,
} from 'lucide-react';
import FileUpload from '@/components/tasks/FileUpload';
import { TaskAttachmentItem } from '@/components/tasks/FileList';
import { formatDate } from '@/lib/utils/dateFormat';

interface TaskData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  department?: { id: string; name: string } | null;
  project?: { id: string; name: string } | null;
  assignee?: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
  reviewer?: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
  creator?: { id: string; full_name: string } | null;
}

interface CommentItem {
  id: string;
  content: string;
  is_review_comment: boolean;
  created_at: string;
  author_name: string;
  author_email: string | null;
  author_avatar: string | null;
}

interface AttachmentItem {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  uploader_name: string;
  created_at: string;
}

interface ActivityItem {
  id: string;
  action: string;
  details: any;
  created_at: string;
  actor_name: string;
}

export default function SingleTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const taskId = params.taskId as string;

  const [task, setTask] = useState<TaskData | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachmentItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [permissions, setPermissions] = useState<any>({});
  const [employees, setEmployees] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');

  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignEmployeeId, setReassignEmployeeId] = useState('');

  // Edit Task modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editReviewerId, setEditReviewerId] = useState('');

  // Revoke Approval modal state
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokeFeedback, setRevokeFeedback] = useState('');

  // Delete Task modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTask = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete task');
      router.push(`/c/${companySlug}/tasks`);
    } catch (err: any) {
      setError(err.message || 'Error deleting task');
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Comment input
  const [newComment, setNewComment] = useState('');

  const fetchTaskDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [taskRes, commentRes, empRes] = await Promise.all([
        fetch(`/api/companies/${companySlug}/tasks/${taskId}`),
        fetch(`/api/companies/${companySlug}/tasks/${taskId}/comments`),
        fetch(`/api/companies/${companySlug}/employees`),
      ]);

      const taskData = await taskRes.json();
      const commentData = await commentRes.json();
      const empData = await empRes.json();

      if (!taskRes.ok) throw new Error(taskData.error || 'Failed to load task details');

      setTask(taskData.task);
      setPermissions(taskData.userPermissions || {});
      setAttachments(taskData.attachments || []);
      setActivities(taskData.activities || []);
      setComments(commentData.comments || []);
      setEmployees(empData.employees || []);

      if (taskData.task) {
        setEditTitle(taskData.task.title || '');
        setEditDescription(taskData.task.description || '');
        setEditPriority(taskData.task.priority || 'MEDIUM');
        setEditStartDate(
          taskData.task.start_date ? taskData.task.start_date.split('T')[0] : ''
        );
        setEditDueDate(
          taskData.task.due_date ? taskData.task.due_date.split('T')[0] : ''
        );
        setEditReviewerId(taskData.task.reviewer?.id || '');
      }
    } catch (err: any) {
      console.error('Error loading task:', err);
      setError(err.message || 'Error loading task');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug && taskId) {
      fetchTaskDetails();
    }
  }, [companySlug, taskId]);

  // Status transitions
  const handleStatusChange = async (targetStatus: string, note?: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, note }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      await fetchTaskDetails();
    } catch (err: any) {
      console.error('Status transition error:', err);
      setError(err.message || 'Error changing status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reviewer: Approve
  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: 'Approved deliverable.' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve task');

      await fetchTaskDetails();
    } catch (err: any) {
      console.error('Approve error:', err);
      setError(err.message || 'Error approving task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reviewer: Request Revision
  const handleRequestRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionFeedback.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: revisionFeedback.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request revision');

      setIsRevisionModalOpen(false);
      setRevisionFeedback('');
      await fetchTaskDetails();
    } catch (err: any) {
      console.error('Revision error:', err);
      setError(err.message || 'Error requesting revision');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin: Reassign Task
  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignEmployeeId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: reassignEmployeeId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reassign task');

      setIsReassignModalOpen(false);
      setReassignEmployeeId('');
      await fetchTaskDetails();
    } catch (err: any) {
      console.error('Reassign error:', err);
      setError(err.message || 'Error reassigning task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin / Dept Head: Edit Task Specifications
  const handleEditTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          priority: editPriority,
          start_date: editStartDate ? new Date(editStartDate).toISOString() : null,
          due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
          reviewer_id: editReviewerId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task');

      setIsEditModalOpen(false);
      await fetchTaskDetails();
    } catch (err: any) {
      console.error('Edit task error:', err);
      setError(err.message || 'Error updating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reviewer / Admin / Dept Head: Revoke Approval
  const handleRevokeApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'revision_required',
          note: revokeFeedback.trim() || 'Approval revoked for further corrections and adjustments.',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke approval');

      setIsRevokeModalOpen(false);
      setRevokeFeedback('');
      await fetchTaskDetails();
    } catch (err: any) {
      console.error('Revoke approval error:', err);
      setError(err.message || 'Error revoking approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Comments: Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post comment');

      setNewComment('');
      // Refetch comments and activities
      const [commentRes, taskRes] = await Promise.all([
        fetch(`/api/companies/${companySlug}/tasks/${taskId}/comments`),
        fetch(`/api/companies/${companySlug}/tasks/${taskId}`),
      ]);
      const commentData = await commentRes.json();
      const taskData = await taskRes.json();
      setComments(commentData.comments || []);
      setActivities(taskData.activities || []);
    } catch (err: any) {
      console.error('Add comment error:', err);
      setError(err.message || 'Error posting comment');
    }
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'submitted_for_review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'in_progress':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'revision_required':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'blocked':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'cancelled':
        return 'bg-zinc-800 text-zinc-500 border-zinc-700';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-zinc-500 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
        <p className="text-sm font-semibold">Loading task deliverables & timeline...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-20 text-center text-zinc-500 space-y-4">
        <AlertCircle className="w-10 h-10 mx-auto text-red-400" />
        <p className="text-sm text-zinc-300 font-semibold">{error || 'Task deliverable not found.'}</p>
        <Link
          href={`/c/${companySlug}/tasks`}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tasks</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="space-y-2">
        <Link
          href={`/c/${companySlug}/tasks`}
          className="text-xs text-zinc-400 hover:text-indigo-400 inline-flex items-center gap-1.5 transition-colors mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Task Management Hub</span>
        </Link>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center flex-wrap gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {task.title}
              </h1>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                  task.status
                )}`}
              >
                {task.status.replace(/_/g, ' ')}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                  task.priority
                )}`}
              >
                {task.priority} Priority
              </span>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-2">
              <span>Task ID: {task.id.slice(0, 8)}</span>
              <span>•</span>
              <span>Created {formatDate(task.created_at, 'medium')}</span>
            </p>
          </div>

          {/* DYNAMIC ROLE-BASED STATUS ACTION BUTTONS */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* EMPLOYEE ACTIONS */}
            {permissions.canStartWorking && (
              <button
                onClick={() => handleStatusChange('in_progress', 'Started working on deliverable')}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-sky-600/25 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Working</span>
              </button>
            )}

            {permissions.canSubmitForReview && (
              <button
                onClick={() =>
                  handleStatusChange('submitted_for_review', 'Deliverable ready for inspection')
                }
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-amber-600/25 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Review</span>
              </button>
            )}

            {/* REVIEWER ACTIONS */}
            {permissions.canApprove && (
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Deliverable</span>
              </button>
            )}

            {permissions.canRequestRevision && (
              <button
                onClick={() => setIsRevisionModalOpen(true)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-orange-600/20 border border-orange-500/30 text-orange-400 hover:bg-orange-600 hover:text-white text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Request Revision</span>
              </button>
            )}

            {/* REVOKE APPROVAL (Reviewer / Admin / Dept Head) */}
            {permissions.canRevoke && (
              <button
                onClick={() => setIsRevokeModalOpen(true)}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Revoke approval and reopen task for corrections"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revoke Approval</span>
              </button>
            )}

            {/* EDIT TASK SPECIFICATIONS (Admin / Dept Head) */}
            {permissions.canEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Edit task specifications, brief, priority, and dates"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                <span>Edit Task</span>
              </button>
            )}

            {/* ADMIN ACTIONS */}
            {permissions.canReassign && (
              <button
                onClick={() => setIsReassignModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Reassign</span>
              </button>
            )}

            {permissions.canCancel && (
              <button
                onClick={() => handleStatusChange('cancelled', 'Task cancelled by admin')}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:text-red-400 text-zinc-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel Task</span>
              </button>
            )}

            {/* REOPEN CANCELLED TASK (Admin) */}
            {task.status === 'cancelled' && permissions.isAdmin && (
              <button
                onClick={() => handleStatusChange('in_progress', 'Task reopened by admin')}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen Task</span>
              </button>
            )}

            {permissions.canDelete && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isSubmitting || isDeleting}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Permanently delete this deliverable"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid: 2-Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Description, Attachments, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Deliverable Specification & Brief</span>
            </h2>
            <div className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/60 font-mono">
              {task.description || 'No detailed brief provided.'}
            </div>
          </div>

          {/* Attachments Section (Phase 15 File Management) */}
          <FileUpload
            taskId={taskId}
            currentUserId={permissions.userId}
            isAdmin={permissions.isAdmin}
            initialFiles={attachments}
            onUploadSuccess={() => fetchTaskDetails()}
          />

          {/* Comments & Revision Feedback Section */}
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Discussion & Review Feedback ({comments.length})</span>
            </h2>

            {/* Comment Feed */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-3 text-center">
                  No comments or revision feedback posted yet.
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border ${
                      c.is_review_comment
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-zinc-950/60 border-zinc-800/80'
                    } space-y-1.5`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                          {c.author_name.slice(0, 1)}
                        </div>
                        <span className="text-xs font-bold text-white">{c.author_name}</span>
                        {c.is_review_comment && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Revision Feedback
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(c.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • {formatDate(c.created_at, 'short')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed pl-8">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handleAddComment} className="space-y-2 pt-2 border-t border-zinc-800/80">
              <textarea
                rows={2}
                placeholder="Post a question, update, or deliverable note..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Comment</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Column: Metadata & Activity Timeline */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Assignment & Context
            </h3>

            {/* Assignee */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Assignee
              </span>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-500/30">
                  {task.assignee?.full_name ? task.assignee.full_name.slice(0, 1) : '?'}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {task.assignee?.full_name || 'Unassigned'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {task.assignee?.email || 'No email registered'}
                  </span>
                </div>
              </div>
            </div>

            {/* Reviewer */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Designated Reviewer
              </span>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                  {task.reviewer?.full_name ? task.reviewer.full_name.slice(0, 1) : '?'}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {task.reviewer?.full_name || 'Unassigned'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {task.reviewer?.email || 'Responsible for approval'}
                  </span>
                </div>
              </div>
            </div>

            {/* Department */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Department
              </span>
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-zinc-400" />
                <span>{task.department?.name || 'General Workspace'}</span>
              </span>
            </div>

            {/* Project */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Parent Project Portfolio
              </span>
              {task.project ? (
                <Link
                  href={`/c/${companySlug}/projects/${task.project.id}`}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{task.project.name} →</span>
                </Link>
              ) : (
                <span className="text-xs text-zinc-500 italic">No project attached</span>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Start Date (DD/MM/YYYY)
                </span>
                <span className="text-xs font-mono text-zinc-300 block">
                  {task.start_date ? formatDate(task.start_date, 'short') : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Due Date (DD/MM/YYYY)
                </span>
                <span className="text-xs font-mono text-zinc-300 block">
                  {task.due_date ? formatDate(task.due_date, 'short') : 'Open-ended'}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Audit Timeline</span>
            </h3>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-zinc-800">
              {activities.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No recorded events yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="relative flex items-start gap-3 text-xs">
                    <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 z-10 text-[10px] text-zinc-400">
                      •
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-semibold text-zinc-200 block">
                        {act.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-zinc-400 block">
                        by {act.actor_name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 block">
                        {new Date(act.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REVISION FEEDBACK MODAL */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Request Task Revision</h3>
                  <p className="text-xs text-zinc-400">
                    Provide clear instructions for the assignee on what adjustments are required.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestRevisionSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Revision Feedback & Action Items <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain exactly what needs to be changed or refined..."
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-semibold hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !revisionFeedback.trim()}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Revision Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN TASK MODAL */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Reassign Task</h3>
              </div>
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Select New Assignee <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={reassignEmployeeId}
                  onChange={(e) => setReassignEmployeeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.user_id || emp.id}>
                      {emp.full_name} ({emp.designation || 'Member'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reassignEmployeeId}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Reassignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK SPECIFICATIONS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Task Specifications</h3>
                  <p className="text-xs text-zinc-400">
                    Update task brief, priority, dates, or assign a reviewer.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditTaskSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Task Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Description Brief */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Specification Brief & Deliverable Requirements
                </label>
                <textarea
                  rows={5}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Outline the scope, milestones, or specific guidelines..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none font-mono"
                />
              </div>

              {/* Priority & Reviewer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Reviewer</label>
                  <select
                    value={editReviewerId}
                    onChange={(e) => setEditReviewerId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">No Reviewer (Auto-approve)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.user_id || emp.id}>
                        {emp.full_name} ({emp.designation || 'Member'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start & Due Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Start Date <span className="text-zinc-500 font-normal">(DD/MM/YYYY)</span>
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Due Date <span className="text-zinc-500 font-normal">(DD/MM/YYYY)</span>
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-semibold hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Pencil className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVOKE APPROVAL MODAL */}
      {isRevokeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Revoke Task Approval</h3>
                  <p className="text-xs text-zinc-400">
                    Reopen task to Revision Required so corrections can be submitted.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRevokeModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRevokeApprovalSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Correction Instructions for Assignee <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why approval was revoked and what adjustments or file replacements are required..."
                  value={revokeFeedback}
                  onChange={(e) => setRevokeFeedback(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsRevokeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-semibold hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !revokeFeedback.trim()}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Revoke Approval & Reopen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white">Delete Deliverable Task?</h3>
                <p className="text-xs text-zinc-400 truncate">#{task.id.slice(0, 8)} • {task.title}</p>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">"{task.title}"</strong>? All associated attachments, reviews, comments, and activities will be permanently deleted. This action cannot be undone.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
