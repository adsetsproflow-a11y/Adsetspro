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

  const channels = ['#general', '#designers', '#developers', '#content'];

  useEffect(() => {
    const update = () => {
      setMessages(saasStore.getChannelMessages(activeChannel));
      setCurrentUser(saasStore.getActiveUser());
    };
    update();
    const unsub = saasStore.subscribe(update);
    return unsub;
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setIsBroadcastModalOpen(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  const isAdmin = currentUser.role === 'company_admin' || currentUser.role === 'super_admin';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col md:flex-row h-[620px]">
      {/* Channels Sidebar */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between bg-zinc-50/60 dark:bg-zinc-950/40">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-xs uppercase tracking-wider text-zinc-500">
              Department Channels
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Supabase Realtime Connected" />
          </div>

          <div className="space-y-1">
            {channels.map((chan) => (
              <button
                key={chan}
                onClick={() => setActiveChannel(chan)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeChannel === chan
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Hash className="w-3.5 h-3.5 opacity-80" />
                <span>{chan.replace('#', '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Admin Broadcast Trigger */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          {isAdmin ? (
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>Admin Broadcast</span>
            </button>
          ) : (
            <div className="text-[11px] text-zinc-400 text-center italic">
              Broadcasts managed by Company Admins
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="flex-1 flex flex-col justify-between bg-white dark:bg-zinc-900">
        {/* Chat Header */}
        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {activeChannel.replace('#', '')}
            </h3>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              • Team real-time workspace discussions
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Live WebSockets</span>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-xs">
              No messages in {activeChannel} yet. Start the conversation below!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <img
                    src={msg.sender_avatar}
                    alt={msg.sender_name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-zinc-300 dark:ring-zinc-700"
                  />
                  <div className={`space-y-1 ${isMe ? 'items-end' : ''}`}>
                    <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {msg.sender_name}
                      </span>
                      <span className="text-zinc-400">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none'
                      }`}
                    >
                      {msg.message}

                      {msg.attachment_url && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-white/20">
                          <img
                            src={msg.attachment_url}
                            alt="Attachment preview"
                            className="max-h-48 object-cover w-full"
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

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 bg-zinc-50/50 dark:bg-zinc-950/40"
        >
          <input
            type="text"
            placeholder={`Message ${activeChannel}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Admin Broadcast Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsBroadcastModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 mb-3">
              <Megaphone className="w-6 h-6" />
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                Send Urgent Broadcast to ALL Employees
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              This message will immediately pop up at the top of every employee screen with an alarm chime and dispatch automated email warnings.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Broadcast Title / Headline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 🚨 ALL-HANDS SPRINT DEMO AT 4:00 PM"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Urgent Announcement Details
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the deadline, action items, or critical notification..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-zinc-400">
                  🔔 Will trigger Web Audio alert & Resend email logs
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer"
                  >
                    Fire Broadcast 🚨
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
