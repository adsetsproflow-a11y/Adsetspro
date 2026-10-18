'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ListTodo,
  ArrowLeft,
  Calendar,
  Clock,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Paperclip,
  Download,
  Upload,
  MessageSquare,
  Building,
  Briefcase,
  User,
  RefreshCw,
  X,
  FileText,
  ShieldCheck,
} from 'lucide-react';

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
  reviewer?: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
  creator?: { id: string; full_name: string } | null;
  assignee?: { id: string; full_name: string } | null;
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

export default function EmployeeTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const taskId = params.taskId as string;

  const [task, setTask] = useState<TaskData | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [revisionFeedback, setRevisionFeedback] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submission & Upload Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionFileName, setSubmissionFileName] = useState('');
  const [submissionFileUrl, setSubmissionFileUrl] = useState('');
  const [submissionNote, setSubmissionNote] = useState('');

  // Comment Box
  const [newComment, setNewComment] = useState('');

  const fetchTaskDetails = async () => {
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
      const comms: CommentItem[] = commentData.comments || [];
      setComments(comms);

      // Find latest review comment if status is revision_required
      const latestRevComment = [...comms]
        .reverse()
        .find((c) => c.is_review_comment);
      if (latestRevComment) {
        setRevisionFeedback(latestRevComment.content);
      }
    } catch (err: any) {
      console.error('Error loading task details:', err);
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

  // Start Working: assigned -> in_progress
  const handleStartWorking = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress', note: 'Employee started working' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      await fetchTaskDetails();
    } catch (err: any) {
      console.error('Start working error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Acknowledge & Start Revision: revision_required -> in_progress
  const handleAcknowledgeRevision = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress',
          note: 'Employee acknowledged revision request and began revisions',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to acknowledge revision');

      await fetchTaskDetails();
    } catch (err: any) {
      console.error('Acknowledge revision error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit for Review with Deliverable File Upload
  const handleSubmitForReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. If file provided, attach deliverable
      if (submissionFileName.trim() && submissionFileUrl.trim()) {
        await fetch(`/api/companies/${companySlug}/tasks/${taskId}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_name: submissionFileName.trim(),
            storage_path: submissionFileUrl.trim(),
            file_size: 204800,
            file_type: 'deliverable/asset',
          }),
        });
      }

      // 2. If submission note provided, add comment
      if (submissionNote.trim()) {
        await fetch(`/api/companies/${companySlug}/tasks/${taskId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `Submission Note: ${submissionNote.trim()}`,
          }),
        });
      }

      // 3. Update status to submitted_for_review
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'submitted_for_review',
          note: submissionNote.trim() || 'Deliverable submitted for review',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit for review');

      setIsSubmitModalOpen(false);
      setSubmissionFileName('');
      setSubmissionFileUrl('');
      setSubmissionNote('');
      await fetchTaskDetails();
    } catch (err: any) {
      console.error('Submit for review error:', err);
      setError(err.message || 'Error submitting deliverable');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Comment
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
      const commentRes = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/comments`);
      const commentData = await commentRes.json();
      setComments(commentData.comments || []);
    } catch (err: any) {
      console.error('Comment error:', err);
      setError(err.message);
    }
  };

  const getStatusBadgeStyle = (st: string) => {
    switch (st) {
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

  const getPriorityBadgeStyle = (p: string) => {
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
        <p className="text-sm font-semibold">Loading deliverable details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-20 text-center text-zinc-500 space-y-4">
        <AlertCircle className="w-10 h-10 mx-auto text-red-400" />
        <p className="text-sm text-zinc-300 font-semibold">{error || 'Deliverable not found.'}</p>
        <Link
          href={`/c/${companySlug}/my-tasks`}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Workdesk</span>
        </Link>
      </div>
    );
  }

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== 'approved' &&
    task.status !== 'cancelled';

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div className="space-y-2">
        <Link
          href={`/c/${companySlug}/my-tasks`}
          className="text-xs text-zinc-400 hover:text-indigo-400 inline-flex items-center gap-1.5 transition-colors mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Workdesk</span>
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
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                  task.status
                )}`}
              >
                {task.status.replace(/_/g, ' ')}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getPriorityBadgeStyle(
                  task.priority
                )}`}
              >
                {task.priority} Priority
              </span>
              {isOverdue && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Past Deadline</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Assigned deliverable in {task.department?.name || 'General Workspace'}
            </p>
          </div>

          {/* PRIMARY EMPLOYEE STATUS ACTION BUTTONS */}
          <div className="flex items-center gap-2.5">
            {task.status === 'assigned' && (
              <button
                onClick={handleStartWorking}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-sky-600/25 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Working</span>
              </button>
            )}

            {task.status === 'in_progress' && (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-amber-600/25 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Deliverable for Review</span>
              </button>
            )}

            {task.status === 'revision_required' && (
              <button
                onClick={handleAcknowledgeRevision}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-orange-600/25 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Acknowledge & Start Revision</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STATUS BANNERS */}
      {task.status === 'revision_required' && (
        <div className="p-5 rounded-3xl bg-orange-500/10 border border-orange-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
              <RotateCcw className="w-4 h-4" />
              <span>Revision Feedback from {task.reviewer?.full_name || 'Reviewer'}</span>
            </div>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload & Re-submit</span>
            </button>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-orange-500/20 text-xs sm:text-sm text-zinc-200 font-mono leading-relaxed">
            {revisionFeedback || 'Please review the comments section below for detailed instructions.'}
          </div>
        </div>
      )}

      {task.status === 'submitted_for_review' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-300 text-xs font-semibold">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Your deliverable has been submitted and is currently awaiting inspection by{' '}
              {task.reviewer?.full_name || 'the reviewer'}.
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full">
            Under Review
          </span>
        </div>
      )}

      {task.status === 'approved' && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Deliverable signed off and approved by {task.reviewer?.full_name || 'Reviewer'}!</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full">
            Approved 🎉
          </span>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Description, Reference Attachments, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deliverable Brief Card */}
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Deliverable Brief & Instructions</span>
            </h2>
            <div className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/60 font-mono">
              {task.description || 'No detailed instructions provided.'}
            </div>
          </div>

          {/* Download Reference Attachments (Uploaded by Admin/Manager) */}
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-400" />
                <span>Reference Attachments & Deliverables ({attachments.length})</span>
              </h2>
              {(task.status === 'in_progress' || task.status === 'revision_required') && (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Attach Deliverable</span>
                </button>
              )}
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-2">
                No reference documents or deliverable files attached yet.
              </p>
            ) : (
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">{att.file_name}</span>
                        <span className="text-[10px] text-zinc-500 block">
                          Uploaded by {att.uploader_name} • {new Date(att.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <a
                      href={att.storage_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task Comments / Conversation Section */}
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Conversation & Feedback ({comments.length})</span>
            </h2>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-3 text-center">
                  No comments yet. Have a question? Send a note to your reviewer.
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
                        • {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed pl-8">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-2 pt-2 border-t border-zinc-800/80">
              <textarea
                rows={2}
                placeholder="Message your reviewer or add a deliverable update..."
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
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Context & Metadata */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Deliverable Details
            </h3>

            {/* Reviewer */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Designated Reviewer
              </span>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                  {task.reviewer?.full_name ? task.reviewer.full_name.slice(0, 1) : 'R'}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {task.reviewer?.full_name || 'Department Reviewer'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {task.reviewer?.email || 'Approver for this deliverable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Project */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Project Portfolio
              </span>
              {task.project ? (
                <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{task.project.name}</span>
                </span>
              ) : (
                <span className="text-xs text-zinc-500 italic">No project linked</span>
              )}
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

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Start Date
                </span>
                <span className="text-xs font-mono text-zinc-300 block">
                  {task.start_date ? new Date(task.start_date).toLocaleDateString() : '—'}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border space-y-1 ${
                  isOverdue
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-zinc-950/60 border-zinc-800/80'
                }`}
              >
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Deadline
                </span>
                <span
                  className={`text-xs font-mono block ${
                    isOverdue ? 'text-red-400 font-bold' : 'text-zinc-300'
                  }`}
                >
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Open-ended'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMIT FOR REVIEW / RE-SUBMIT MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Submit Deliverable for Review</h3>
                  <p className="text-xs text-zinc-400">
                    Upload asset link and include notes for your reviewer.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForReview} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Deliverable File Name / Asset Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Final-Palette-Documentation.pdf"
                  value={submissionFileName}
                  onChange={(e) => setSubmissionFileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Deliverable Link / Cloud Asset URL
                </label>
                <input
                  type="text"
                  placeholder="https://figma.com/... or cloud link"
                  value={submissionFileUrl}
                  onChange={(e) => setSubmissionFileUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Submission Notes for Reviewer
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize completed items, changes made, and verification..."
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-semibold hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-amber-600/25 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Submit for Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
