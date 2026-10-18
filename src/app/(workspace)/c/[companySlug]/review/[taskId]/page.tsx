'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Paperclip,
  Download,
  AlertTriangle,
  RotateCcw,
  Check,
  RefreshCw,
  X,
  FileText,
  Building,
  Briefcase,
  AlertCircle,
  History,
} from 'lucide-react';
import FileList, { TaskAttachmentItem } from '@/components/tasks/FileList';
import { formatDate } from '@/lib/utils/dateFormat';

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  department?: { id: string; name: string } | null;
  project?: { id: string; name: string } | null;
  assignee?: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
  reviewer?: { id: string; full_name: string; email: string } | null;
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

interface ReviewHistoryItem {
  id: string;
  decision: string;
  reviewer_name: string;
  feedback: string;
  created_at: string;
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const taskId = params.taskId as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [attachments, setAttachments] = useState<TaskAttachmentItem[]>([]);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('');

  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [revisionError, setRevisionError] = useState<string | null>(null);

  const fetchReviewDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [taskRes, commentRes] = await Promise.all([
        fetch(`/api/companies/${companySlug}/tasks/${taskId}`),
        fetch(`/api/companies/${companySlug}/tasks/${taskId}/comments`),
      ]);

      const taskData = await taskRes.json();
      const commentData = await commentRes.json();

      if (!taskRes.ok) throw new Error(taskData.error || 'Failed to load task details');

      setTask(taskData.task);
      setAttachments(taskData.attachments || []);

      // Extract review history from comments marked as is_review_comment OR activities
      const rawComments = commentData.comments || [];
      const rawActivities = taskData.activities || [];

      let history: ReviewHistoryItem[] = [];

      // Add review comments
      rawComments
        .filter((c: any) => c.is_review_comment)
        .forEach((c: any) => {
          const isApproval = c.content.toLowerCase().startsWith('approval note:');
          history.push({
            id: c.id,
            decision: isApproval ? 'Approved' : 'Revision Requested',
            reviewer_name: c.author_name,
            feedback: c.content.replace(/^Approval note:\s*/i, ''),
            created_at: c.created_at,
          });
        });

      // Also check activities for revision/approval events if no comments attached
      rawActivities
        .filter((a: any) => a.action === 'REVISION_REQUESTED' || a.action === 'TASK_APPROVED')
        .forEach((a: any) => {
          const alreadyInHistory = history.some(
            (h) => Math.abs(new Date(h.created_at).getTime() - new Date(a.created_at).getTime()) < 3000
          );
          if (!alreadyInHistory) {
            history.push({
              id: a.id,
              decision: a.action === 'TASK_APPROVED' ? 'Approved' : 'Revision Requested',
              reviewer_name: a.details?.reviewer_name || a.actor_name,
              feedback: a.details?.feedback || (a.action === 'TASK_APPROVED' ? 'Deliverable verified and approved.' : 'Changes requested.'),
              created_at: a.created_at,
            });
          }
        });

      // Sort by newest first
      history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReviewHistory(history);
    } catch (err: any) {
      console.error('Fetch review details error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug && taskId) {
      fetchReviewDetails();
    }
  }, [companySlug, taskId]);

  // Handle Approve Submission
  const handleConfirmApprove = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: approveNote.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve task');

      setIsApproveModalOpen(false);
      router.push(`/c/${companySlug}/review`);
    } catch (err: any) {
      console.error('Approve error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Request Revision Submission (Mandatory Feedback)
  const handleConfirmRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevisionError(null);

    const trimmed = revisionFeedback.trim();
    if (!trimmed) {
      setRevisionError('Revision feedback is mandatory. Please explain what changes are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request revision');

      setIsRevisionModalOpen(false);
      setRevisionFeedback('');
      router.push(`/c/${companySlug}/review`);
    } catch (err: any) {
      console.error('Revision error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
        <p className="text-sm font-semibold">Loading deliverable review inspection...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-20 text-center text-zinc-500 space-y-4">
        <AlertCircle className="w-10 h-10 mx-auto text-red-400" />
        <p className="text-sm text-zinc-300 font-semibold">{error || 'Deliverable not found.'}</p>
        <Link
          href={`/c/${companySlug}/review`}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Review Queue</span>
        </Link>
      </div>
    );
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div className="space-y-2">
        <Link
          href={`/c/${companySlug}/review`}
          className="text-xs text-zinc-400 hover:text-amber-400 inline-flex items-center gap-1.5 transition-colors mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Review & Sign-Off Queue</span>
        </Link>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
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
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Awaiting Inspection
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                  task.priority
                )}`}
              >
                {task.priority} Priority
              </span>
              {isOverdue && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Overdue Submission</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Department: {task.department?.name || 'General Workspace'} • Project:{' '}
              {task.project?.name || 'General Portfolio'}
            </p>
          </div>

          {/* REVIEW ACTIONS BUTTONS STRIP */}
          <div className="flex items-center gap-3">
            {/* REQUEST REVISION BUTTON (ORANGE) */}
            <button
              onClick={() => {
                setRevisionError(null);
                setRevisionFeedback('');
                setIsRevisionModalOpen(true);
              }}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-600/10"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Request Revision</span>
            </button>

            {/* APPROVE BUTTON (GREEN) */}
            <button
              onClick={() => setIsApproveModalOpen(true)}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Approve Deliverable</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Task Brief & Submitted Files */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deliverable Brief */}
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Deliverable Brief & Requirements</span>
            </h2>
            <div className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/60 font-mono">
              {task.description || 'No detailed instructions provided.'}
            </div>
          </div>

          {/* SUBMITTED FILES SECTION */}
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-amber-400" />
                <span>Submitted Deliverables & Assets ({attachments.length})</span>
              </h2>
            </div>

            <FileList files={attachments} />
          </div>

          {/* REVIEW HISTORY SECTION (Revision Cycles) */}
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Inspection & Review History ({reviewHistory.length})</span>
            </h2>

            {reviewHistory.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-2">
                This is the first submission cycle for this deliverable.
              </p>
            ) : (
              <div className="space-y-3">
                {reviewHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border space-y-2 ${
                      item.decision === 'Approved'
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-orange-500/5 border-orange-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            item.decision === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          }`}
                        >
                          {item.decision}
                        </span>
                        <span className="text-xs font-bold text-zinc-300">
                          by {item.reviewer_name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(item.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed font-mono bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40">
                      {item.feedback}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Assignee Profile & Metadata */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Submission Metadata
            </h3>

            {/* Assignee Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Assignee
              </span>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-500/30">
                  {task.assignee?.full_name ? task.assignee.full_name.slice(0, 1) : 'U'}
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
                Project
              </span>
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>{task.project?.name || 'General Portfolio'}</span>
              </span>
            </div>

            {/* Target Due Date */}
            <div
              className={`p-3.5 rounded-2xl border space-y-1 ${
                isOverdue ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-950/60 border-zinc-800/80'
              }`}
            >
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Target Deadline (DD/MM/YYYY)
              </span>
              <span
                className={`text-xs font-mono block ${
                  isOverdue ? 'text-red-400 font-bold' : 'text-zinc-200'
                }`}
              >
                {task.due_date ? formatDate(task.due_date, 'short') : 'Open-ended'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* APPROVE CONFIRMATION MODAL (GREEN) */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Approve Deliverable</h3>
                  <p className="text-xs text-zinc-400">
                    Sign off on &quot;{task.title}&quot; as completed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-300">
                Approving this deliverable will mark the task as <strong>approved</strong>, record your sign-off in the audit timeline, and notify {task.assignee?.full_name || 'the assignee'}.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">
                  Optional Praise / Sign-off Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Excellent work on the contrast ratios and assets!"
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-semibold hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
                <span>Confirm & Sign Off</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST REVISION MODAL (MANDATORY FEEDBACK, ORANGE) */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Request Deliverable Revision</h3>
                  <p className="text-xs text-zinc-400">
                    Specify adjustments needed before this task can be approved.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {revisionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{revisionError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmRevision} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Revision Feedback & Actionable Requirements <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail specifically what changes must be made before approval..."
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
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-orange-600/25 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span>Send Revision Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
