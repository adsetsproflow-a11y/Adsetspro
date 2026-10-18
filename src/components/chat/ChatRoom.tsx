'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Send,
  Paperclip,
  X,
  FileText,
  Download,
  Users,
  Hash,
  Briefcase,
  CheckSquare,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Smile,
  ShieldAlert,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at?: string | null;
  profiles?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
  chat_attachments?: Array<{
    id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    storage_path: string;
    created_at?: string;
  }>;
}

interface ChatRoomProps {
  roomId: string;
  roomName: string;
  roomType: string;
  companySlug: string;
  currentUserId: string;
  currentUserName: string;
  initialMessages?: ChatMessage[];
  contextInfo?: {
    taskTitle?: string;
    departmentName?: string;
  };
}

export default function ChatRoom({
  roomId,
  roomName,
  roomType,
  companySlug,
  currentUserId,
  currentUserName,
  initialMessages = [],
  contextInfo,
}: ChatRoomProps) {
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Members modal
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  // Setup Supabase Realtime channel subscription
  useEffect(() => {
    let channel: any = null;
    try {
      const topic = `room:${roomId}`;
      const channels = supabase.getChannels();
      for (const ch of channels) {
        if (ch.topic.includes(topic)) {
          supabase.removeChannel(ch);
        }
      }

      channel = supabase.channel(`${topic}-${Date.now()}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload: any) => {
          const newMsg = payload.new as any;

          // Avoid duplicating if sender was current user and already appended optimistically
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }

            // Fetch sender profile if not in payload
            let senderProfile = null;
            if (newMsg.sender_id === currentUserId) {
              senderProfile = {
                id: currentUserId,
                full_name: currentUserName,
              };
            }

            const messageObj: ChatMessage = {
              id: newMsg.id,
              room_id: newMsg.room_id,
              sender_id: newMsg.sender_id,
              content: newMsg.content,
              created_at: newMsg.created_at,
              profiles: senderProfile,
              chat_attachments: [],
            };

            return [...prev, messageObj];
          });

          // Fetch full message with attachments & sender profile asynchronously
          try {
            const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=10`);
            const data = await res.json();
            if (data.success && data.messages) {
              setMessages(data.messages);
            }
          } catch (e) {
            console.error('Failed to sync new message details:', e);
          }
        }
      )
      .on('broadcast', { event: 'new_message' }, (payload: any) => {
        if (payload.payload?.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.payload.message.id)) return prev;
            return [...prev, payload.payload.message];
          });
        }
      })
      .subscribe((status: any) => {
        setIsConnected(status === 'SUBSCRIBED');
      });
    } catch (err) {
      console.warn('Realtime chat channel notice:', err);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [roomId, currentUserId, currentUserName]);

  // Load room members when requested
  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/members`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to load room members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleOpenMembers = () => {
    setIsMembersOpen(true);
    fetchMembers();
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || isSending) return;

    setIsSending(true);
    const contentToSend = inputText.trim();
    const fileToSend = selectedFile;

    // Reset input states immediately for snappy UX
    setInputText('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      let res;
      if (fileToSend) {
        const formData = new FormData();
        formData.append('content', contentToSend);
        formData.append('file', fileToSend);
        res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: contentToSend }),
        });
      }

      const data = await res.json();

      if (data.success && data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });

        // Broadcast to peers on channel
        const channel = supabase.channel(`room:${roomId}`);
        channel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: { message: data.message },
        });
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Send message error:', err);
      alert('Network error sending message.');
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getRoomIcon = (type: string) => {
    if (type === 'department') return <Briefcase className="w-4 h-4 text-emerald-400" />;
    if (type === 'task') return <CheckSquare className="w-4 h-4 text-amber-400" />;
    return <Hash className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* ROOM HEADER */}
      <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/c/${companySlug}/chat`}
            className="md:hidden p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 shrink-0">
            {getRoomIcon(roomType)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {roomName.startsWith('#') ? roomName : `#${roomName}`}
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {roomType}
              </span>
            </div>
            {contextInfo?.taskTitle && (
              <p className="text-[11px] text-zinc-400 truncate max-w-sm">
                Task: {contextInfo.taskTitle}
              </p>
            )}
            {contextInfo?.departmentName && (
              <p className="text-[11px] text-zinc-400 truncate max-w-sm">
                Dept: {contextInfo.departmentName}
              </p>
            )}
          </div>
        </div>

        {/* Room Header Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isConnected ? 'Realtime Connected' : 'Connecting...'}</span>
          </div>

          <button
            onClick={handleOpenMembers}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="View Members"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members</span>
          </button>
        </div>
      </div>

      {/* MESSAGES FEED */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-zinc-500 py-12">
            <div className="p-4 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-zinc-400">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-200">No messages yet — Start the conversation</p>
              <p className="text-xs text-zinc-500 max-w-xs">
                Welcome to #{roomName}. Say hello or share task deliverables and attachments with your team.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            const senderName = msg.profiles?.full_name || msg.profiles?.email || 'Team Member';
            const firstLetter = senderName.charAt(0).toUpperCase();

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  isMine ? 'flex-row-reverse' : 'flex-row'
                } group`}
              >
                {/* User Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md ${
                    isMine
                      ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500'
                      : 'bg-gradient-to-tr from-zinc-700 to-zinc-600'
                  }`}
                  title={senderName}
                >
                  {firstLetter}
                </div>

                {/* Message Bubble + Meta */}
                <div
                  className={`flex flex-col max-w-[80%] sm:max-w-[70%] space-y-1 ${
                    isMine ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] font-semibold text-zinc-400">
                      {isMine ? 'You' : senderName}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600">
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-lg ${
                      isMine
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                        : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                    {/* Attachments rendering */}
                    {msg.chat_attachments && msg.chat_attachments.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5">
                        {msg.chat_attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between gap-3 p-2 rounded-xl bg-black/20 border border-white/10 text-white"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 shrink-0 text-indigo-300" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold truncate">{att.file_name}</p>
                                <p className="text-[10px] text-zinc-400">
                                  {formatFileSize(att.file_size)}
                                </p>
                              </div>
                            </div>

                            <a
                              href={att.storage_path}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
                              title="Download Attachment"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
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

      {/* ATTACHMENT PREVIEW TICKET (if file chosen) */}
      {selectedFile && (
        <div className="px-6 py-2 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-indigo-300">
            <Paperclip className="w-3.5 h-3.5" />
            <span className="font-semibold truncate max-w-xs">{selectedFile.name}</span>
            <span className="text-[10px] text-zinc-500 font-mono">
              ({formatFileSize(selectedFile.size)})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* INPUT FORM */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 bg-zinc-900/60 border-t border-zinc-800/80 shrink-0"
      >
        <div className="flex items-center gap-2">
          {/* File Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message #${roomName}...`}
            className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedFile) || isSending}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <Send className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </form>

      {/* MEMBERS MODAL */}
      {isMembersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Channel Members</h3>
              </div>
              <button
                onClick={() => setIsMembersOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {isLoadingMembers ? (
                <div className="py-8 text-center text-xs text-zinc-500">Loading members...</div>
              ) : members.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">No members found.</div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{m.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate font-mono">{m.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setIsMembersOpen(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
