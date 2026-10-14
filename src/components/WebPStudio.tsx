'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileImage,
  ArrowRight,
  Download,
  CheckCircle,
  Sparkles,
  Layers,
  Sliders,
  Check,
} from 'lucide-react';
import { saasStore } from '@/lib/storage';
import { Task, UserProfile } from '@/lib/types';
import { audioEngine } from '@/lib/audio';

export const WebPStudio: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [quality, setQuality] = useState<number>(0.85);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [webpBlob, setWebpBlob] = useState<Blob | null>(null);
  const [webpPreview, setWebpPreview] = useState<string | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);
  const [webpSizeKb, setWebpSizeKb] = useState<number>(0);
  const [savingsPercentage, setSavingsPercentage] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [attachedSuccess, setAttachedSuccess] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(saasStore.getActiveUser());

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const update = () => {
      setTasks(saasStore.getCompanyTasks());
      setCurrentUser(saasStore.getActiveUser());
    };
    update();
    const unsub = saasStore.subscribe(update);
    return unsub;
  }, []);

  useEffect(() => {
    if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  const processImage = (file: File, q: number) => {
    setIsProcessing(true);
    setAttachedSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalPreview(dataUrl);
      const origKb = Math.round(file.size / 1024);
      setOriginalSizeKb(origKb);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setWebpBlob(blob);
              const webpUrl = URL.createObjectURL(blob);
              setWebpPreview(webpUrl);
              const wKb = Math.round(blob.size / 1024);
              setWebpSizeKb(wKb);

              const saved = origKb > 0 ? (((origKb - wKb) / origKb) * 100).toFixed(1) : '0';
              setSavingsPercentage(parseFloat(saved));
              audioEngine.playBellChime();
            }
            setIsProcessing(false);
          },
          'image/webp',
          q
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      alert('Please select a valid image file (.png, .jpg, .jpeg, .webp)');
      return;
    }
    setOriginalFile(file);
    processImage(file, quality);
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (originalFile) {
      processImage(originalFile, newQ);
    }
  };

  const downloadWebP = () => {
    if (!webpPreview || !originalFile) return;
    const a = document.createElement('a');
    a.href = webpPreview;
    const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || originalFile.name;
    a.download = `${baseName}.webp`;
    a.click();
  };

  const downloadOriginal = () => {
    if (!originalPreview || !originalFile) return;
    const a = document.createElement('a');
    a.href = originalPreview;
    a.download = originalFile.name;
    a.click();
  };

  const handleAttachToTask = () => {
    if (!selectedTaskId || !webpPreview || !originalFile) return;

    const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || originalFile.name;
    saasStore.attachDeliverableToTask(selectedTaskId, {
      uploaded_by: currentUser.id,
      original_name: originalFile.name,
      webp_name: `${baseName}.webp`,
      webp_url: webpPreview,
      original_url: originalPreview || undefined,
      original_size_kb: originalSizeKb,
      webp_size_kb: webpSizeKb,
      savings_percentage: savingsPercentage,
    });

    setAttachedSuccess(true);
    setTimeout(() => {
      setAttachedSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-pink-900/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                HTML5 Canvas Engine
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Lossless / Near-Lossless WebP
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              WebP Conversion Studio & Deliverable Pipeline
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl mt-0.5">
              Drag-and-drop raw designer assets (.png, .jpg), convert to lightweight WebP in-browser, inspect compression savings, and instantly attach to task deliverables.
            </p>
          </div>

          {/* Quality Slider */}
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-w-56">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                WebP Quality:
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                {Math.round(quality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileSelect(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 bg-white/50 dark:bg-zinc-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
          Drop your image here or <span className="text-indigo-600 dark:text-indigo-400 underline">browse files</span>
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Supports PNG, JPG, JPEG, and WebP up to 50MB
        </p>
      </div>

      {/* Comparison & Action Section */}
      {originalPreview && webpPreview && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
          {/* Metrics Card Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="text-xs text-zinc-500">Original Size</div>
              <div className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mt-1">
                {originalSizeKb >= 1024 ? `${(originalSizeKb / 1024).toFixed(2)} MB` : `${originalSizeKb} KB`}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                {originalFile?.name}
              </div>
            </div>

            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                Converted WebP Size
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {webpSizeKb >= 1024 ? `${(webpSizeKb / 1024).toFixed(2)} MB` : `${webpSizeKb} KB`}
              </div>
              <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                Ready for production deployment
              </div>
            </div>

            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                Bandwidth Savings
              </div>
              <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5" />
                {savingsPercentage}% Saved
              </div>
              <div className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
                Saved {(originalSizeKb - webpSizeKb)} KB CDN egress
              </div>
            </div>
          </div>

          {/* Visual Previews Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                <span>Original Preview</span>
                <span className="font-mono text-[11px]">{originalSizeKb} KB</span>
              </div>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 max-h-72 flex items-center justify-center p-2">
                <img
                  src={originalPreview}
                  alt="Original Asset"
                  className="max-h-64 object-contain rounded-lg"
                />
              </div>
            </div>

            {/* WebP Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>WebP Output Preview</span>
                <span className="font-mono text-[11px]">{webpSizeKb} KB</span>
              </div>
              <div className="border border-emerald-500/30 dark:border-emerald-600/30 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 max-h-72 flex items-center justify-center p-2 relative">
                <img
                  src={webpPreview}
                  alt="WebP Converted Asset"
                  className="max-h-64 object-contain rounded-lg"
                />
                <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  .WEBP
                </span>
              </div>
            </div>
          </div>

          {/* Actions & Deliverable Pipeline */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            {/* Dual Download Buttons */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto">
              {/* Default WebP Download */}
              <button
                onClick={downloadWebP}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download .webp (Default)</span>
              </button>

              {/* Dual Download: Original PNG/JPG */}
              <button
                onClick={downloadOriginal}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                title="Download original uncompressed source file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Original (RAW)</span>
              </button>
            </div>

            {/* Attach to Task Deliverables */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs cursor-pointer truncate"
              >
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.department}] {t.title}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAttachToTask}
                disabled={attachedSuccess}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white transition-colors cursor-pointer shrink-0 shadow-sm ${
                  attachedSuccess
                    ? 'bg-emerald-600'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {attachedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Attached!</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Attach to Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliverable Assets Gallery for the Company */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileImage className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                Company Deliverable Asset Library
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                All client-ready WebP visual deliverables attached across active sprint tasks.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-400">
            {tasks.flatMap((t) => t.attachments || []).length} Deliverables
          </span>
        </div>

        {tasks.flatMap((t) => t.attachments || []).length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-xs bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            No image deliverables attached yet. Use the upload converter above to attach assets!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {tasks.flatMap((t) =>
              (t.attachments || []).map((att) => ({ ...att, taskTitle: t.title }))
            ).map((item) => (
              <div
                key={item.id}
                className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 overflow-hidden flex flex-col justify-between group hover:border-indigo-500/50 transition-all"
              >
                <div className="relative h-40 bg-zinc-950/20 overflow-hidden flex items-center justify-center p-2">
                  <img
                    src={item.webp_url}
                    alt={item.webp_name}
                    className="max-h-full max-w-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[10px] font-black shadow">
                    -{item.savings_percentage}% WEBP
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                      {item.webp_name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate">
                      Task: {item.taskTitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                    <span>
                      {item.webp_size_kb} KB <span className="line-through text-zinc-400 text-[10px]">({item.original_size_kb} KB)</span>
                    </span>
                    <button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = item.webp_url;
                        a.download = item.webp_name;
                        a.click();
                        audioEngine.playBellChime();
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
