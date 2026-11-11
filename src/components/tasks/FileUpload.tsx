'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  X,
  FileText,
  CheckCircle2,
  Paperclip,
  Sparkles,
  Link2,
  ExternalLink,
  Globe,
  Plus,
  Loader2,
} from 'lucide-react';
import FileList, { TaskAttachmentItem } from './FileList';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'webp', 'png', 'jpg', 'jpeg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (lightweight storage)

interface FileUploadProps {
  taskId: string;
  currentUserId?: string;
  isAdmin?: boolean;
  initialFiles?: TaskAttachmentItem[];
  onUploadSuccess?: (file: TaskAttachmentItem) => void;
}

export default function FileUpload({
  taskId,
  currentUserId,
  isAdmin = false,
  initialFiles = [],
  onUploadSuccess,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
  const [files, setFiles] = useState<TaskAttachmentItem[]>(initialFiles);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Link state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [isAttachingLink, setIsAttachingLink] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of 5MB.`;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type .${ext || 'unknown'} is not allowed. Only small images (WEBP, PNG, JPG) and documents (PDF, DOC, DOCX) are permitted.`;
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateFile(file);

      if (validationError) {
        setErrorMessage(validationError);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMessage(null);
    setSuccessMessage(null);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressTimer);
          return 85;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('taskId', taskId);

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload deliverable file.');
      }

      setUploadProgress(100);
      setSuccessMessage(`"${selectedFile.name}" successfully uploaded and encrypted.`);

      const newAttachment: TaskAttachmentItem = {
        id: data.file.id,
        task_id: data.file.taskId,
        file_name: data.file.fileName,
        file_size: data.file.fileSize,
        file_type: data.file.fileType,
        version: data.file.version,
        created_at: data.file.createdAt,
        uploaded_by: currentUserId || null,
        uploader_name: data.file.uploaderName,
      };

      setFiles((prev) => [newAttachment, ...prev]);

      if (onUploadSuccess) {
        onUploadSuccess(newAttachment);
      }

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 800);
    } catch (err: any) {
      clearInterval(progressTimer);
      setUploadProgress(0);
      setIsUploading(false);
      setErrorMessage(err.message || 'Network upload error.');
    }
  };

  const handleAttachLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim() || isAttachingLink) return;

    setIsAttachingLink(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/files/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          linkUrl: linkUrl.trim(),
          linkTitle: linkTitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to attach deliverable link.');
      }

      setSuccessMessage(`Deliverable link "${data.file.fileName}" successfully attached!`);

      const newAttachment: TaskAttachmentItem = {
        id: data.file.id,
        task_id: data.file.taskId,
        file_name: data.file.fileName,
        file_size: 0,
        file_type: 'link',
        storage_path: data.file.storagePath,
        version: data.file.version,
        created_at: data.file.createdAt,
        uploaded_by: currentUserId || null,
        uploader_name: data.file.uploaderName,
      };

      setFiles((prev) => [newAttachment, ...prev]);
      setLinkUrl('');
      setLinkTitle('');

      if (onUploadSuccess) {
        onUploadSuccess(newAttachment);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error attaching deliverable link.');
    } finally {
      setIsAttachingLink(false);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  return (
    <div className="space-y-6">
      {/* UPLOAD & LINK SUBMISSION CARD */}
      <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
        {/* Card Header with Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Deliverable &amp; Attachment Upload
            </h3>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab('file');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('link');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Share Link</span>
            </button>
          </div>
        </div>

        {/* TAB 1: FILE UPLOAD */}
        {activeTab === 'file' && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.webp,.png,.jpg,.jpeg"
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-2xl text-center space-y-2 cursor-pointer transition-colors bg-zinc-900/30 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-200">
                    Click to browse or drag &amp; drop deliverable file
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Permitted: Small Images (WEBP, PNG, JPG) • Docs (PDF, DOC, DOCX) - Up to 5MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-indigo-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={isUploading}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Cancel selection"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="mt-3 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Encrypting &amp; uploading to private storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LINK SHARING INPUT */}
        {activeTab === 'link' && (
          <form onSubmit={handleAttachLink} className="space-y-3 animate-in fade-in duration-150">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-cyan-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Share Deliverable Link (Figma, Docs, Loom, GitHub, Site)</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Instant access for Manager &amp; Employee</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* URL Input (takes 2 cols on desktop) */}
                <div className="sm:col-span-2 relative">
                  <Link2 className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    required
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://figma.com/file/... or https://docs.google.com/..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
                  />
                </div>

                {/* Optional Title Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="Asset Title (e.g. Design Prototype)"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-zinc-400">
                  Shared links are saved permanently and accessible by both Head/Manager &amp; Employee.
                </p>

                <button
                  type="submit"
                  disabled={!linkUrl.trim() || isAttachingLink}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 shrink-0"
                >
                  {isAttachingLink ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Attaching...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Attach Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Notifications */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* UPLOADED ATTACHMENTS & LINKS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Attached Deliverables ({files.length})
          </h4>
          <span className="text-[11px] text-zinc-500">Files &amp; Shared Links</span>
        </div>

        <FileList
          files={files}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onDeleteFile={handleDeleteFile}
        />
      </div>
    </div>
  );
}
