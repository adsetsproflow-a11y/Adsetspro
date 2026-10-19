'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hash, Plus, X, Users, Loader2, Sparkles, Check } from 'lucide-react';

interface Colleague {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
}

interface CreateGroupChannelModalProps {
  companySlug: string;
  colleagues: Colleague[];
  triggerVariant?: 'header' | 'icon';
}

export default function CreateGroupChannelModal({
  companySlug,
  colleagues = [],
  triggerVariant = 'header',
}: CreateGroupChannelModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [isAllMembers, setIsAllMembers] = useState(true);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleToggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!channelName.trim()) {
      setErrorMsg('Please enter a channel name.');
      return;
    }

    if (!isAllMembers && selectedMemberIds.length === 0) {
      setErrorMsg('Please select at least one colleague to add to the group.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companySlug,
          name: channelName.trim(),
          isAllMembers,
          memberIds: isAllMembers ? [] : selectedMemberIds,
        }),
      });

      const data = await res.json();

      if (data.success && data.room?.id) {
        setIsOpen(false);
        setChannelName('');
        setSelectedMemberIds([]);
        router.push(`/c/${companySlug}/chat/${data.room.id}`);
        router.refresh();
      } else {
        setErrorMsg(data.error || 'Failed to create channel.');
      }
    } catch (err: any) {
      console.error('Create group error:', err);
      setErrorMsg('Network error creating group channel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRole = (role?: string | null) => {
    if (role === 'COMPANY_ADMIN') return 'Admin';
    if (role === 'DEPARTMENT_HEAD') return 'Dept Head';
    if (role === 'EMPLOYEE') return 'Employee';
    return role || '';
  };

  return (
    <>
      {triggerVariant === 'icon' ? (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setErrorMsg('');
          }}
          className="p-1 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Create Group Channel"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setErrorMsg('');
          }}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group Channel</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-zinc-800 p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Group Channel</h3>
                  <p className="text-[11px] text-zinc-400">
                    Group discussions applied across all selected team members.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Channel Name</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-zinc-500 font-mono text-sm">#</span>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="e.g. announcements, project-alpha"
                    className="w-full pl-8 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-500">
                  Letters, numbers, and dashes. Automatically formatted in lowercase.
                </p>
              </div>

              {/* Membership Scope */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-zinc-300">Channel Members</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAllMembers(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isAllMembers
                        ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold">All Members</p>
                    <p className="text-[10px] text-zinc-500">Public to entire company</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAllMembers(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !isAllMembers
                        ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold">Select Teammates</p>
                    <p className="text-[10px] text-zinc-500">Specific team members</p>
                  </button>
                </div>
              </div>

              {/* Teammates List (if not all members) */}
              {!isAllMembers && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-zinc-900/40 rounded-xl border border-zinc-800">
                  <p className="text-[10px] font-mono uppercase text-zinc-500 px-1 pb-1">
                    Select Colleagues:
                  </p>
                  {colleagues.length === 0 ? (
                    <p className="text-xs text-zinc-500 p-2">No other teammates found.</p>
                  ) : (
                    colleagues.map((c) => {
                      const isSelected = selectedMemberIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleToggleMember(c.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-600/20 text-white'
                              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                              {(c.full_name || c.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {c.full_name || c.email}
                              </p>
                              <p className="text-[10px] text-zinc-500 truncate">{c.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {c.role && (
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                                {formatRole(c.role)}
                              </span>
                            )}
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'border-zinc-700 bg-zinc-900'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !channelName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Channel</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
