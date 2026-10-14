'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Hash,
  Radio,
  Image as ImageIcon,
  Smile,
  AlertTriangle,
  Megaphone,
  BellRing,
  X,
  Check,
  Zap,
  Flame,
  Code2,
  Palette,
  TrendingUp,
  FlaskConical,
  PenTool,
  CheckCircle,
  Users,
} from 'lucide-react';
import { saasStore } from '@/lib/storage';
import { Message, UserProfile } from '@/lib/types';
import { audioEngine } from '@/lib/audio';

export const ChatSystem: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<string>('#general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<UserProfile>(saasStore.getActiveUser());
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'urgent' | 'warning' | 'info'>('urgent');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channels = [
    { name: '#general', desc: 'All-hands announcements & updates' },
    { name: '#development', desc: 'Engineering, APIs, Code reviews' },
    { name: '#design', desc: 'Figma mockups, WebP banners, Assets' },
    { name: '#marketing', desc: 'Ad campaigns, Copywriting, CRO' },
    { name: '#qa-testing', desc: 'Bug reports, Test cases, QA checks' },
  ];

  useEffect(() => {
    const update = () => {
      setCurrentUser(saasStore.getActiveUser());
      setMessages(saasStore.getMessages());
    };
    update();
    const unsub = saasStore.subscribe(update);
    return unsub;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    saasStore.sendMessage(activeChannel, inputText.trim());
    setInputText('');
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    saasStore.sendBroadcast(broadcastTitle.trim(), broadcastMessage.trim(), broadcastSeverity);
    saasStore.sendMessage('#general', `🚨 **ADMIN BROADCAST ALERT: ${broadcastTitle.trim()}**\n${broadcastMessage.trim()}`);

    setIsBroadcastModalOpen(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  const channelMessages = messages.filter((m) => m.channel_name === activeChannel);
  const profiles = saasStore.getProfiles();
  const isAdmin = currentUser.role === 'company_admin' || currentUser.role === 'super_admin';
  const activeCompany = saasStore.getActiveCompany();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col md:flex-row h-[650px]">
      {/* 1. Sidebar: Department Channels */}
      <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between bg-zinc-50/70 dark:bg-zinc-950/50">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <span className="font-extrabold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Team Channels
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {activeCompany.name} Workspace
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Team Chat Active" />
          </div>

          {/* Channel List */}
          <div className="space-y-1">
            {channels.map((chan) => (
              <button
                key={chan.name}
                onClick={() => setActiveChannel(chan.name)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  activeChannel === chan.name
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 opacity-80" />
                  <span>{chan.name.replace('#', '')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Broadcast Trigger Button (Admins only) */}
        {isAdmin && (
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Send Urgent Push Alert</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Chat Conversation Area */}
      <div className="flex-1 flex flex-col justify-between bg-white dark:bg-zinc-900">
        {/* Channel Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-500" />
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {activeChannel}
              </h3>
              <span className="text-[11px] text-zinc-400">
                {channels.find((c) => c.name === activeChannel)?.desc}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Logged in as:</span>
            <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{currentUser.full_name}</strong>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {channelMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 space-y-2">
              <Hash className="w-10 h-10 opacity-30 text-indigo-500" />
              <p className="text-xs font-semibold">No messages in {activeChannel} yet.</p>
              <p className="text-[11px]">Start the conversation with your team members!</p>
            </div>
          ) : (
            channelMessages.map((msg) => {
              const author = profiles.find((p) => p.id === msg.sender_id) || {
                full_name: msg.sender_name || 'Team Member',
                avatar_url: msg.sender_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                role: 'worker',
                designation: 'Developer',
                department: 'Development',
              };
              const isMe = msg.sender_id === currentUser.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <img
                    src={author.avatar_url}
                    alt={author.full_name}
                    className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0"
                  />
                  <div className={`space-y-1 max-w-md ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{author.full_name}</span>
                      <span className="text-zinc-400 text-[10px]">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      {msg.attachment_url && (
                        <div className="mt-2">
                          <img
                            src={msg.attachment_url}
                            alt="Attachment"
                            className="rounded-lg max-h-48 object-cover border border-white/20"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Channel Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message ${activeChannel}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Broadcast Alert Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsBroadcastModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                  Broadcast Urgent Alert
                </h3>
                <p className="text-xs text-zinc-500">
                  Pushes an audible alarm chime to all team members instantly.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Alert Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. CRITICAL: Client Presentation in 1 Hour"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Message Details
                </label>
                <textarea
                  placeholder="Describe the urgent requirement or blocker..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  Broadcast Push Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
