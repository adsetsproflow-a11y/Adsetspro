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
  Image as ImageIcon,
  Maximize2,
  Trash2,
  ExternalLink,
  Sparkles,
  Eye,
  Check,
  Pencil,
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState<AttachmentItem | null>(null);
  const [galleryLightbox, setGalleryLightbox] = useState<{
    url: string;
    title: string;
    uploader?: string;
    date?: string;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const isImageAttachment = (att: AttachmentItem) => {
    return (
      att.file_type?.startsWith('image/') ||
      /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(att.file_name || att.storage_path) ||
      att.storage_path?.startsWith('data:image/')
    );
  };

  const handleDeleteAttachment = async (attachment: AttachmentItem) => {
    if (
      !confirm(
        `Are you sure you want to delete "${attachment.file_name}"? If this was the wrong deliverable, you can upload the correct one.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(
        `/api/companies/${companySlug}/tasks/${taskId}/attachments?attachmentId=${attachment.id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete attachment');
      await fetchTaskDetails();
    } catch (err: any) {
      alert(err.message || 'Error deleting attachment');
    }
  };

  const handleOpenReplaceModal = (attachment: AttachmentItem) => {
    setEditingAttachment(attachment);
    setSubmissionFileName(attachment.file_name);
    setSubmissionFileUrl(attachment.storage_path.startsWith('http') ? attachment.storage_path : '');
    setIsSubmitModalOpen(true);
  };

  const handleDownloadAttachment = async (attachment: AttachmentItem) => {
    try {
      const res = await fetch(`/api/files/${attachment.id}/download`);
      const data = await res.json();
      const url = data.downloadUrl || attachment.storage_path;
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(attachment.storage_path, '_blank');
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!submissionFileName.trim()) {
      setSubmissionFileName(file.name);
    }
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Determine active preview
  const isCloudImage = Boolean(
    submissionFileUrl &&
    /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(submissionFileUrl.trim())
  );
  const activeImagePreview = previewUrl || (isCloudImage ? submissionFileUrl.trim() : null);

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
      // 1. If a local file was selected, upload via /api/files/upload
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('taskId', taskId);

        const uploadRes = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Failed to upload deliverable file.');
        }
      } else if (submissionFileName.trim() && submissionFileUrl.trim()) {
        // Link-only deliverable attachment
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
      const noteContent = submissionNote.trim()
        ? `Submission Note: ${submissionNote.trim()}${selectedFile ? ` (Attached: ${selectedFile.name})` : ''}`
        : selectedFile
        ? `Submission Note: Deliverable attached - ${selectedFile.name}`
        : '';

      if (noteContent) {
        await fetch(`/api/companies/${companySlug}/tasks/${taskId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: noteContent,
          }),
        });
      }

      // 3. Update status to submitted_for_review
      const res = await fetch(`/api/companies/${companySlug}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'submitted_for_review',
          note:
            submissionNote.trim() ||
            `Deliverable submitted for review${selectedFile ? `: ${selectedFile.name}` : ''}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit for review');

      // If replacing an existing attachment, remove the old one
      if (editingAttachment) {
        try {
          await fetch(
            `/api/companies/${companySlug}/tasks/${taskId}/attachments?attachmentId=${editingAttachment.id}`,
            { method: 'DELETE' }
          );
        } catch (e) {
          console.warn('Failed to delete previous attachment:', e);
        }
      }

      setIsSubmitModalOpen(false);
      setEditingAttachment(null);
      handleClearFile();
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
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-300 text-xs font-semibold">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Deliverable is submitted and awaiting review by {task.reviewer?.full_name || 'the reviewer'}.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingAttachment(null);
                setIsSubmitModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Update / Re-submit Deliverable</span>
            </button>
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full">
              Under Review
            </span>
          </div>
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

          {/* Reference Attachments & Deliverables Gallery */}
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-indigo-400" />
                  <span>Reference Attachments & Deliverables ({attachments.length})</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Visual deliverable preview, image zoom, downloads, and correction controls.
                </p>
              </div>

              {(task.status === 'in_progress' ||
                task.status === 'revision_required' ||
                task.status === 'submitted_for_review') && (
                <button
                  onClick={() => {
                    setEditingAttachment(null);
                    setIsSubmitModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Attach Deliverable</span>
                </button>
              )}
            </div>

            {attachments.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-zinc-800/80 rounded-2xl space-y-2">
                <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-semibold">No deliverable files or images attached yet.</p>
                <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                  Click &quot;Attach Deliverable&quot; above or &quot;Submit Deliverable for Review&quot; to upload your work.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attachments.map((att) => {
                  const isImg = isImageAttachment(att);
                  return (
                    <div
                      key={att.id}
                      className="group relative rounded-2xl bg-zinc-950/80 border border-zinc-800/90 hover:border-zinc-700 p-3.5 space-y-3 transition-all shadow-md flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        {isImg ? (
                          /* Visual Image Thumbnail with Hover Zoom */
                          <div
                            onClick={() =>
                              setGalleryLightbox({
                                url: att.storage_path,
                                title: att.file_name,
                                uploader: att.uploader_name,
                                date: att.created_at,
                              })
                            }
                            className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/60 border border-zinc-800 flex items-center justify-center cursor-pointer group/img"
                          >
                            <img
                              src={att.storage_path}
                              alt={att.file_name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs">
                              <Maximize2 className="w-4 h-4 text-amber-400" />
                              <span>Click to Zoom</span>
                            </div>
                            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[9px] font-mono text-zinc-300 border border-zinc-700/60 uppercase">
                              {att.file_type?.split('/')[1] || 'IMAGE'}
                            </span>
                          </div>
                        ) : (
                          /* Non-image Document Header */
                          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                                {att.file_type || 'DOCUMENT'}
                              </span>
                              <span className="text-xs font-bold text-white truncate block">
                                {att.file_name}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* File Info */}
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white truncate block" title={att.file_name}>
                            {att.file_name}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            {(att.file_size / (1024 * 1024)).toFixed(2)} MB • {att.uploader_name} •{' '}
                            {new Date(att.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {isImg && (
                            <button
                              type="button"
                              onClick={() =>
                                setGalleryLightbox({
                                  url: att.storage_path,
                                  title: att.file_name,
                                  uploader: att.uploader_name,
                                  date: att.created_at,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Zoom / Preview Image"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>Zoom</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(att)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Download Deliverable"
                          >
                            <Download className="w-3.5 h-3.5 text-sky-400" />
                            <span>Download</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenReplaceModal(att)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                            title="Edit / Replace Wrong File"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Wrong File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingAttachment ? 'Replace Deliverable / Correct Image' : 'Submit Deliverable for Review'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {editingAttachment
                      ? 'Upload the corrected image or file to replace the previous deliverable.'
                      : 'Upload asset files, provide external links, and preview before submitting to reviewer.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSubmitModalOpen(false);
                  setEditingAttachment(null);
                  handleClearFile();
                }}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForReview} className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Form Inputs & Upload (7 cols) */}
                <div className="lg:col-span-7 space-y-3.5">
                  {/* 1. Deliverable Title / Asset Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span>Deliverable Asset Title *</span>
                      <span className="text-[10px] text-zinc-500 font-normal">Auto-filled or custom</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Final-Palette-Documentation.pdf"
                      value={submissionFileName}
                      onChange={(e) => setSubmissionFileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* 2. Upload Section (File & Image Upload Dropzone) */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Upload Deliverable File or Image</span>
                      </span>
                      <span className="text-[10px] text-zinc-500">Max 50MB</span>
                    </label>

                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.docx,.xlsx,.zip"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                        isDragging
                          ? 'border-amber-400 bg-amber-500/10'
                          : selectedFile
                          ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60'
                          : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900/80'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 group-hover:scale-105 group-hover:text-amber-300 transition-all shadow-md">
                          {selectedFile?.type.startsWith('image/') ? (
                            <ImageIcon className="w-5 h-5" />
                          ) : selectedFile ? (
                            <FileText className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>

                        <div className="space-y-0.5">
                          {selectedFile ? (
                            <>
                              <p className="text-xs font-bold text-white truncate max-w-xs mx-auto">
                                {selectedFile.name}
                              </p>
                              <p className="text-[11px] text-emerald-400 font-medium">
                                Click or drop to replace ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-semibold text-zinc-200">
                                <span className="text-amber-400 underline underline-offset-2">Click to browse</span> or drag & drop image/file
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                Images (PNG, JPG, WEBP, GIF, SVG) • Docs (PDF, ZIP, DOCX)
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Deliverable Link / Cloud Asset URL (Optional) */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Deliverable Link / Cloud Asset URL (Optional)</span>
                      </span>
                      <span className="text-[10px] text-zinc-500">Figma, Drive, Loom, PR</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://figma.com/... or cloud link"
                      value={submissionFileUrl}
                      onChange={(e) => setSubmissionFileUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* 4. Submission Notes for Reviewer */}
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
                    {/* Quick fill chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Quick Add:
                      </span>
                      {[
                        '✨ Ready for review',
                        '🎨 Assets exported',
                        '🔍 Checked & verified',
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setSubmissionNote((prev) =>
                              prev ? `${prev} • ${chip}` : chip
                            );
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Deliverable & Image Preview Panel (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3 min-h-[340px]">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Asset Preview
                      </span>
                    </div>
                    {activeImagePreview ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Image
                      </span>
                    ) : selectedFile ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                        File Attached
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500">No Asset Yet</span>
                    )}
                  </div>

                  {/* Preview Content Area */}
                  <div className="flex-1 flex flex-col justify-center items-center">
                    {activeImagePreview ? (
                      <div className="w-full space-y-2.5">
                        {/* Image Thumbnail Container */}
                        <div className="relative group rounded-xl overflow-hidden border border-zinc-700/80 bg-zinc-950 flex items-center justify-center max-h-52">
                          <img
                            src={activeImagePreview}
                            alt="Deliverable preview"
                            className="w-full h-auto max-h-52 object-contain rounded-xl"
                          />
                          {/* Zoom Button Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsLightboxOpen(true)}
                              className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Zoom Fullscreen</span>
                            </button>
                          </div>
                        </div>

                        {/* Image Details Bar */}
                        <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5 text-left text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white truncate max-w-[170px]">
                              {selectedFile?.name || submissionFileName || 'Image Asset'}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              {selectedFile
                                ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                                : 'URL Asset'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                            <button
                              type="button"
                              onClick={() => setIsLightboxOpen(true)}
                              className="text-[11px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <Maximize2 className="w-3 h-3" />
                              <span>View Fullscreen</span>
                            </button>
                            {selectedFile && (
                              <button
                                type="button"
                                onClick={handleClearFile}
                                className="text-[11px] text-red-400 hover:text-red-300 inline-flex items-center gap-1 cursor-pointer font-medium"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : selectedFile ? (
                      /* Non-Image File Preview (PDF, ZIP, DOCX) */
                      <div className="w-full p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center space-y-3">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto w-fit">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[200px] mx-auto">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Document'}
                          </p>
                        </div>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleClearFile}
                            className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove File</span>
                          </button>
                        </div>
                      </div>
                    ) : submissionFileUrl ? (
                      /* Cloud Link Preview */
                      <div className="w-full p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center space-y-3">
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto w-fit">
                          <ExternalLink className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">External Asset Link</p>
                          <p className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate max-w-[200px] mx-auto">
                            {submissionFileUrl}
                          </p>
                        </div>
                        <a
                          href={submissionFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-semibold"
                        >
                          <span>Open in New Tab</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      /* Empty State */
                      <div className="text-center py-6 px-3 space-y-2 border-2 border-dashed border-zinc-800/80 rounded-xl w-full">
                        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 mx-auto w-fit">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-semibold text-zinc-300">Deliverable Preview</p>
                        <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[190px] mx-auto">
                          Upload an image or file on the left to see live preview here before submitting.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitModalOpen(false);
                    handleClearFile();
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
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
                  <span>
                    {editingAttachment ? 'Replace & Update Deliverable' : 'Submit for Review'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX PREVIEW MODAL FOR UPLOAD PREVIEW */}
      {isLightboxOpen && activeImagePreview && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeImagePreview}
              alt="Fullscreen deliverable preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-zinc-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-xs text-zinc-400 mt-3 text-center">
              {selectedFile?.name || submissionFileName || 'Deliverable Asset'}
            </p>
          </div>
        </div>
      )}

      {/* GALLERY LIGHTBOX FOR ATTACHED DELIVERABLE IMAGES */}
      {galleryLightbox && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setGalleryLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-[92vh] flex flex-col items-center">
            <button
              onClick={() => setGalleryLightbox(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={galleryLightbox.url}
              alt={galleryLightbox.title}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain border border-zinc-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 text-center space-y-1">
              <p className="text-sm font-bold text-white">{galleryLightbox.title}</p>
              <p className="text-xs text-zinc-400">
                Uploaded by {galleryLightbox.uploader || 'Team member'}{' '}
                {galleryLightbox.date && `• ${new Date(galleryLightbox.date).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
