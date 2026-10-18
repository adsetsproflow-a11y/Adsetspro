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
} from 'lucide-react';
import FileList, { TaskAttachmentItem } from './FileList';

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'zip'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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

  const [files, setFiles] = useState<TaskAttachmentItem[]>(initialFiles);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateFile = (file: File): string | null => {
    // 1. Size check (<= 50MB)
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of 50MB.`;
    }

    // 2. Extension check
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type .${ext || 'unknown'} is not allowed. Only PDF, DOCX, XLSX, PNG, JPG, GIF, and ZIP are permitted.`;
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

    // Simulate progressive upload indicator
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

      // Reset selection
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

  const handleDeleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  return (
    <div className="space-y-6">
      {/* UPLOAD BOX */}
      <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Deliverable & Attachment Upload
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Max 50MB (Private & Encrypted)</span>
        </div>

        {/* Hidden Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.gif,.zip"
          className="hidden"
        />

        {/* Drag / Select Area */}
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
                Click to browse or drag & drop deliverable file
              </p>
              <p className="text-[11px] text-zinc-500">
                Permitted: PDF, DOCX, XLSX, PNG, JPG, GIF, ZIP (Up to 50MB)
              </p>
            </div>
          </div>
        ) : (
          /* Selected File Preview Box */
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
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
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

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-1.5 animate-in fade-in duration-150">
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span>Encrypting & uploading to private storage...</span>
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

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* UPLOADED ATTACHMENTS LIST SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Attached Deliverables ({files.length})
          </h4>
          <span className="text-[11px] text-zinc-500">60-second expiring download tokens</span>
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
