'use client';

import React, { useState, useEffect } from 'react';
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
  Maximize2,
  X,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dateFormat';

export interface TaskAttachmentItem {
  id: string;
  task_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path?: string;
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
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    fileName: string;
    uploader?: string;
    date?: string;
  } | null>(null);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };
    if (lightboxImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  const isImageAttachment = (file: TaskAttachmentItem) => {
    const ext = file.file_name.split('.').pop()?.toLowerCase() || '';
    return (
      ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext) ||
      (file.file_type && file.file_type.startsWith('image/'))
    );
  };

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
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) || fileType.includes('image')) {
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
      if (
        file.storage_path &&
        (file.storage_path.startsWith('http://') ||
          file.storage_path.startsWith('https://') ||
          file.storage_path.startsWith('blob:') ||
          file.storage_path.startsWith('data:'))
      ) {
        const link = document.createElement('a');
        link.href = file.storage_path;
        link.download = file.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const res = await fetch(`/api/files/${file.id}/download`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.downloadUrl) {
        if (file.storage_path) {
          window.open(file.storage_path, '_blank');
          return;
        }
        alert(data.error || 'Failed to generate secure download link');
        return;
      }

      // Trigger download using the signed URL
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName || file.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      if (file.storage_path) {
        window.open(file.storage_path, '_blank');
      } else {
        alert('Error initiating file download');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenZoom = async (file: TaskAttachmentItem) => {
    if (
      file.storage_path &&
      (file.storage_path.startsWith('http://') ||
        file.storage_path.startsWith('https://') ||
        file.storage_path.startsWith('blob:') ||
        file.storage_path.startsWith('data:'))
    ) {
      setLightboxImage({
        url: file.storage_path,
        fileName: file.file_name,
        uploader: file.uploader_name,
        date: file.created_at,
      });
      return;
    }

    // Otherwise fetch signed url
    try {
      const res = await fetch(`/api/files/${file.id}/download`);
      const data = await res.json();
      if (res.ok && data.success && data.downloadUrl) {
        setLightboxImage({
          url: data.downloadUrl,
          fileName: file.file_name,
          uploader: file.uploader_name,
          date: file.created_at,
        });
      } else if (file.storage_path) {
        setLightboxImage({
          url: file.storage_path,
          fileName: file.file_name,
          uploader: file.uploader_name,
          date: file.created_at,
        });
      }
    } catch {
      if (file.storage_path) {
        setLightboxImage({
          url: file.storage_path,
          fileName: file.file_name,
          uploader: file.uploader_name,
          date: file.created_at,
        });
      }
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

  // Separate image attachments and document attachments for rich visual rendering
  const imageFiles = files.filter(isImageAttachment);
  const docFiles = files.filter((f) => !isImageAttachment(f));

  return (
    <div className="space-y-4">
      {/* 1. VISUAL IMAGE THUMBNAILS GRID (Deliverables & Artwork) */}
      {imageFiles.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            Visual Deliverables ({imageFiles.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {imageFiles.map((file) => {
              const canDelete = isAdmin || (currentUserId && file.uploaded_by === currentUserId);
              const isDownloading = downloadingId === file.id;
              const isDeleting = deletingId === file.id;
              const hasDirectUrl = Boolean(
                file.storage_path &&
                  (file.storage_path.startsWith('http://') ||
                    file.storage_path.startsWith('https://') ||
                    file.storage_path.startsWith('blob:') ||
                    file.storage_path.startsWith('data:'))
              );

              return (
                <div
                  key={file.id}
                  className="group relative rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 p-3 space-y-2.5 transition-all shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Thumbnail Image Box */}
                    <div
                      onClick={() => handleOpenZoom(file)}
                      className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/70 border border-zinc-800/90 flex items-center justify-center cursor-pointer group/img"
                    >
                      {hasDirectUrl ? (
                        <img
                          src={file.storage_path}
                          alt={file.file_name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-1.5 p-4 text-center">
                          <ImageIcon className="w-8 h-8 text-purple-400/80" />
                          <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]">
                            {file.file_name}
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay with Zoom Button */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs">
                        <Maximize2 className="w-4 h-4 text-amber-400" />
                        <span>Inspect & Zoom</span>
                      </div>

                      {/* Version badge */}
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-mono text-zinc-300 border border-zinc-700/60 uppercase">
                        v{file.version || 1}
                      </span>
                    </div>

                    {/* File Meta */}
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white truncate block" title={file.file_name}>
                        {file.file_name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                        <span className="font-mono">{formatFileSize(file.file_size)}</span>
                        <span>•</span>
                        <span className="truncate max-w-[100px]">{file.uploader_name || 'Member'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenZoom(file)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Inspect Deliverable Fullscreen"
                    >
                      <Eye className="w-3 h-3 text-indigo-400" />
                      <span>Zoom</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        disabled={isDownloading}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all text-xs cursor-pointer disabled:opacity-40"
                        title="Download file"
                      >
                        <Download
                          className={`w-3.5 h-3.5 ${
                            isDownloading ? 'animate-bounce text-indigo-400' : ''
                          }`}
                        />
                      </button>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(file)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-red-500/10 hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40"
                          title="Delete file permanently"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. DOCUMENTS & SPREADSHEETS LIST */}
      {docFiles.length > 0 && (
        <div className="space-y-2">
          {imageFiles.length > 0 && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block pt-1">
              Documents & Specifications ({docFiles.length})
            </span>
          )}
          <div className="space-y-2">
            {docFiles.map((file) => {
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
                          {formatDate(file.created_at, 'short')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Download & Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      disabled={isDownloading}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      title="Download file"
                    >
                      <Download
                        className={`w-3.5 h-3.5 ${
                          isDownloading ? 'animate-bounce text-indigo-400' : ''
                        }`}
                      />
                      <span className="hidden sm:inline">
                        {isDownloading ? 'Downloading...' : 'Download'}
                      </span>
                    </button>

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
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    {lightboxImage.fileName}
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate">
                    Uploaded by {lightboxImage.uploader || 'Team Member'}{' '}
                    {lightboxImage.date ? `• ${formatDate(lightboxImage.date, 'long')}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.url}
                  download={lightboxImage.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* High-Res Image Display */}
            <div className="relative flex-1 min-h-[300px] max-h-[75vh] flex items-center justify-center p-4 bg-black/80 overflow-auto">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.fileName}
                className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
