'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Clock,
  Sparkles,
  Download,
  Image as ImageIcon,
  User,
  UploadCloud,
  CheckCircle2,
  Check,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, Message, UserProfile } from '@/lib/types';
import { saasStore } from '@/lib/storage';
import { audioEngine } from '@/lib/audio';

interface TaskDrawerProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({ task, onClose }) => {
  const [comments, setComments] = useState<Message[]>([]);
  const [commentText, setCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile>(saasStore.getActiveUser());
  const [profiles, setProfiles] = useState<UserProfile[]>(saasStore.getProfiles());

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!task) return;
    const update = () => {
      setComments(saasStore.getTaskComments(task.id));
      setCurrentUser(saasStore.getActiveUser());
      setProfiles(saasStore.getProfiles());
    };
    update();
    const unsub = saasStore.subscribe(update);
    return unsub;
  }, [task]);

  if (!task) return null;

  const assignee = profiles.find((p) => p.id === task.assigned_to);
  const assigner = profiles.find((p) => p.id === task.created_by);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    saasStore.sendMessage('#task-discussion', commentText.trim(), undefined, task.id);
    setCommentText('');
  };

  const handleDrawerUpload = (file: File) => {
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

              saasStore.attachDeliverableToTask(task.id, {
                uploaded_by: currentUser.id,
                original_name: file.name,
                webp_name: `${baseName}.webp`,
                webp_url: webpUrl,
                original_url: dataUrl,
                original_size_kb: origKb,
                webp_size_kb: wKb,
                savings_percentage: parseFloat(saved),
              });

              saasStore.updateTaskStatus(task.id, 'review');
              audioEngine.playSuccessChime();

              try {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.6 },
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

  const handleApprove = () => {
    saasStore.updateTaskStatus(task.id, 'completed');
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
      });
    } catch (_) {}
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              {task.department}
            </span>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mt-1">
              {task.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Details Overview & Assigner / Assignee info */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3.5">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {task.description}
          </p>

          {/* People & Hierarchy Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Assigned to Worker */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-medium">Assigned Worker</span>
              <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mt-0.5">
                {assignee ? (
                  <>
                    <img src={assignee.avatar_url} className="w-4 h-4 rounded-full object-cover" />
                    <span>{assignee.full_name}</span>
                  </>
                ) : (
                  <span>Unassigned</span>
                )}
              </div>
            </div>

            {/* Assigned By (Manager/Admin) */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-medium">Assigned By</span>
              <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mt-0.5">
                {assigner ? (
                  <>
                    <img src={assigner.avatar_url} className="w-4 h-4 rounded-full object-cover" />
                    <span>{assigner.full_name}</span>
                  </>
                ) : (
                  <span>System Admin</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-medium">Status Pipeline</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 capitalize">
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-medium">Reward XP</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                +{task.reward_xp} XP
              </span>
            </div>
          </div>

          {/* Deliverables & Assigner Download Section */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                Deliverables & Finished Assets
              </span>
              {task.status === 'review' && (
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve Deliverable
                </button>
              )}
            </div>

            {/* List Deliverables with One-Click Assigner Download */}
            {task.attachments && task.attachments.length > 0 ? (
              <div className="space-y-2">
                {task.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl border border-emerald-500/30 dark:border-emerald-700/40 bg-emerald-50/40 dark:bg-emerald-950/30 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={att.webp_url}
                        alt={att.webp_name}
                        className="w-12 h-12 rounded-lg object-cover ring-1 ring-emerald-500/40"
                      />
                      <div>
                        <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-44">
                          {att.webp_name}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          {att.webp_size_kb} KB • <span className="font-black">-{att.savings_percentage}% saved</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Original: {att.original_size_kb} KB
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <a
                        href={att.webp_url}
                        download={att.webp_name}
                        target="_blank"
                        rel="noreferrer"
                        title="Download WebP Deliverable"
                        className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>WebP</span>
                      </a>
                      {att.original_url && (
                        <a
                          href={att.original_url}
                          download={att.original_name}
                          target="_blank"
                          rel="noreferrer"
                          title="Download RAW Original Source File"
                          className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold cursor-pointer"
                        >
                          RAW Source
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 text-xs">
                No deliverable uploaded yet by employee.
              </div>
            )}

            {/* Quick Upload Button inside Drawer */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleDrawerUpload(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Finished Deliverable (PNG/JPG ➔ WebP)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Task Discussion & Activity Feed
          </div>

          {comments.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-xs italic">
              No comments yet on this deliverable. Leave instructions or feedback below.
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <img
                  src={c.sender_avatar}
                  alt={c.sender_name}
                  className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-zinc-300 dark:ring-zinc-700"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {c.sender_name}
                    </span>
                    <span className="text-zinc-400">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                    {c.message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form
          onSubmit={handleSendComment}
          className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950"
        >
          <input
            type="text"
            placeholder="Write a message to assignee or reviewer..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
