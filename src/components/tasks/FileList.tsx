'use client';

import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Archive,
  Download,
  Trash2,
  Table,
  Clock,
  User,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export interface TaskAttachmentItem {
  id: string;
  task_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  version?: number;
  created_at: string;
  uploaded_by?: string | null;
  uploader_name?: string;
}

interface FileListProps {
  files: TaskAttachmentItem[];
  currentUserId?: string;
  isAdmin?: boolean;
  onDeleteFile?: (fileId: string) => void;
}

export default function FileList({
  files,
  currentUserId,
  isAdmin = false,
  onDeleteFile,
}: FileListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getFileIcon = (fileType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (ext === 'pdf' || fileType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-400" />;
    }
    if (ext === 'xlsx' || ext === 'xls' || fileType.includes('sheet') || fileType.includes('excel')) {
      return <Table className="w-5 h-5 text-emerald-400" />;
    }
    if (ext === 'docx' || ext === 'doc' || fileType.includes('word')) {
      return <FileText className="w-5 h-5 text-blue-400" />;
    }
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext) || fileType.includes('image')) {
      return <ImageIcon className="w-5 h-5 text-purple-400" />;
    }
    if (ext === 'zip' || fileType.includes('zip') || fileType.includes('compressed')) {
      return <Archive className="w-5 h-5 text-amber-400" />;
    }

    return <FileText className="w-5 h-5 text-zinc-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = async (file: TaskAttachmentItem) => {
    setDownloadingId(file.id);
    try {
      const res = await fetch(`/api/files/${file.id}/download`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.downloadUrl) {
        alert(data.error || 'Failed to generate secure download link');
        return;
      }

      // Trigger download using the 60s signed URL
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName || file.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      alert('Error initiating file download');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (file: TaskAttachmentItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${file.file_name}"?`)) {
      return;
    }

    setDeletingId(file.id);
    try {
      const res = await fetch(`/api/files/${file.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to delete file');
        return;
      }

      if (onDeleteFile) {
        onDeleteFile(file.id);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting file');
    } finally {
      setDeletingId(null);
    }
  };

  if (!files || files.length === 0) {
    return (
      <div className="py-8 text-center border border-dashed border-zinc-800 rounded-2xl p-6 text-zinc-500 text-xs">
        No documents or deliverables attached yet.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {files.map((file) => {
        const canDelete = isAdmin || (currentUserId && file.uploaded_by === currentUserId);
        const isDownloading = downloadingId === file.id;
        const isDeleting = deletingId === file.id;

        return (
          <div
            key={file.id}
            className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between gap-3 shadow-md"
          >
            {/* File Icon & Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
                {getFileIcon(file.file_type, file.file_name)}
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate max-w-xs block">
                    {file.file_name}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                    v{file.version || 1}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <span className="font-mono">{formatFileSize(file.file_size)}</span>
                  <span>•</span>
                  <span className="truncate max-w-[120px]">
                    {file.uploader_name || 'Team member'}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-zinc-500">
                    {new Date(file.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Download & Delete */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Secure Download Button */}
              <button
                type="button"
                onClick={() => handleDownload(file)}
                disabled={isDownloading}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                title="Download file (Generates 60s signed link)"
              >
                <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce text-indigo-400' : ''}`} />
                <span className="hidden sm:inline">{isDownloading ? 'Signing...' : 'Download'}</span>
              </button>

              {/* Delete Button (Only uploader or Admin) */}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(file)}
                  disabled={isDeleting}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-red-500/10 hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40"
                  title="Delete file permanently"
                >
                  <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
