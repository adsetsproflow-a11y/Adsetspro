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
  Sparkles,
  ArrowLeft,
  Trash2,
  User,
  AlertTriangle,
  Loader2,
  Check,
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
  isAdmin?: boolean;
  directOtherUser?: {
    id: string;
    fullName?: string;
    email?: string;
    role?: string;
    avatarUrl?: string;
  } | null;
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
  isAdmin = false,
  directOtherUser,
}: ChatRoomProps) {
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Deletion & Clear state
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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

  // 1. Setup Supabase Realtime channel subscription (shared room:roomId topic)
  useEffect(() => {
    let channel: any = null;
    try {
      const topic = `room:${roomId}`;

      // Clean up previous channel with this topic if exists
      const existingChannels = supabase.getChannels();
      for (const ch of existingChannels) {
        if (ch.topic === topic) {
          supabase.removeChannel(ch);
        }
      }

      channel = supabase.channel(topic, {
        config: { broadcast: { self: false } },
      });

      channelRef.current = channel;

      channel
        // Realtime INSERT via Postgres replication
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
            if (!newMsg) return;

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) {
                return prev;
              }

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

            // Sync full details (profile + attachments)
            try {
              const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=25`);
              const data = await res.json();
              if (data.success && Array.isArray(data.messages)) {
                setMessages(data.messages);
              }
            } catch (e) {
              console.error('Failed to sync new message details:', e);
            }
          }
        )
        // Realtime DELETE via Postgres replication
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${roomId}`,
          },
          (payload: any) => {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setMessages((prev) => prev.filter((m) => m.id !== deletedId));
            }
          }
        )
        // Instant Broadcast: new_message
        .on('broadcast', { event: 'new_message' }, (payload: any) => {
          if (payload.payload?.message) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.payload.message.id)) return prev;
              return [...prev, payload.payload.message];
            });
          }
        })
        // Instant Broadcast: delete_message
        .on('broadcast', { event: 'delete_message' }, (payload: any) => {
          if (payload.payload?.messageId) {
            setMessages((prev) => prev.filter((m) => m.id !== payload.payload.messageId));
          }
        })
        // Instant Broadcast: clear_chat
        .on('broadcast', { event: 'clear_chat' }, () => {
          setMessages([]);
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

  // 2. Continuous Background Sync (2.5s auto-poll fallback for 100% rock-solid delivery)
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=50`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.messages)) {
          setMessages((prev) => {
            // Check if count or last message changed
            if (
              prev.length !== data.messages.length ||
              (data.messages.length > 0 &&
                prev[prev.length - 1]?.id !== data.messages[data.messages.length - 1]?.id)
            ) {
              return data.messages;
            }
            return prev;
          });
        }
      } catch (err) {
        // Silently skip transient polling errors
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId]);

  // Load room members when requested
  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/members`);
      const data = await res.json();
      if (data.success) {
        // Exclude super admin from members list
        setMembers(
          (data.members || []).filter(
            (m: any) => m.email !== 'owner@adsetsproflow.com' && !m.is_super_admin
          )
        );
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

    // Clear input immediately for snappy feel
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
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'new_message',
            payload: { message: data.message },
          });
        }
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

  // Delete single message permanently from DB and storage
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Permanently delete this message from the database?')) {
      return;
    }

    setDeletingMessageId(messageId);
    // Optimistic removal
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages?messageId=${messageId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        // Broadcast delete to all peers
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'delete_message',
            payload: { messageId },
          });
        }
      } else {
        alert(data.error || 'Failed to delete message.');
        // Refresh to restore message if deletion was rejected
        const refreshRes = await fetch(`/api/chat/rooms/${roomId}/messages?limit=50`);
        const refreshData = await refreshRes.json();
        if (refreshData.messages) setMessages(refreshData.messages);
      }
    } catch (err) {
      console.error('Delete message error:', err);
      alert('Network error deleting message.');
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Clear entire room permanently from DB and storage
  const handleClearRoom = async () => {
    setIsClearing(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages?clearAll=true`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setMessages([]);
        setIsClearModalOpen(false);

        // Broadcast clear to all peers
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'clear_chat',
          });
        }
      } else {
        alert(data.error || 'Failed to clear chat room.');
      }
    } catch (err) {
      console.error('Clear chat error:', err);
      alert('Network error clearing chat.');
    } finally {
      setIsClearing(false);
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
    if (type === 'direct') return <User className="w-4 h-4 text-cyan-400" />;
    return <Hash className="w-4 h-4 text-indigo-400" />;
  };

  const formatRoleBadge = (role?: string) => {
    if (role === 'COMPANY_ADMIN') return 'Company Admin';
    if (role === 'DEPARTMENT_HEAD') return 'Dept Head';
    if (role === 'EMPLOYEE') return 'Employee';
    return role || 'Member';
  };

  const displayRoomTitle =
    roomType === 'direct'
      ? directOtherUser?.fullName || directOtherUser?.email || 'Direct Conversation'
      : roomName === 'general'
      ? '#general'
      : roomName.startsWith('#')
      ? roomName
      : `#${roomName}`;

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* ROOM HEADER */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Back Button (Visible to all: Company Admin, Dept Head, Employee) */}
          <Link
            href={`/c/${companySlug}/chat`}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0 group"
            title="Back to All Discussions"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
            <span className="font-semibold">Back</span>
          </Link>

          <div className="p-2 sm:p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 shrink-0">
            {getRoomIcon(roomType)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[160px] sm:max-w-md">
                {displayRoomTitle}
              </h2>
              {roomType === 'direct' ? (
                <span className="whitespace-nowrap inline-flex items-center text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                  {formatRoleBadge(directOtherUser?.role)}
                </span>
              ) : (
                <span className="whitespace-nowrap inline-flex items-center text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                  {roomType === 'company' ? 'Company Channel' : 'Department Channel'}
                </span>
              )}
            </div>

            {roomType === 'direct' ? (
              <p className="text-[11px] text-zinc-400 truncate max-w-sm">
                {directOtherUser?.email || '1-on-1 Direct Message'}
              </p>
            ) : roomType === 'company' ? (
              <p className="text-[11px] text-zinc-400">All company members</p>
            ) : (
              <p className="text-[11px] text-zinc-400">Department team members & Admin</p>
            )}
          </div>
        </div>

        {/* Room Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium shadow-sm shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Live Chat</span>
          </div>

          {/* Clear Chat Button (Company Admin or Direct Message Participants) */}
          {(isAdmin || roomType === 'direct') && (
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              disabled={messages.length === 0}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500/40 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Clear all messages permanently to free database space"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}

          {/* Room Members Button */}
          {roomType !== 'direct' && (
            <button
              onClick={handleOpenMembers}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View Members"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members</span>
            </button>
          )}
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
              <p className="text-sm font-bold text-zinc-200">
                {roomType === 'direct'
                  ? `Direct conversation with ${displayRoomTitle}`
                  : `No messages yet in ${displayRoomTitle}`}
              </p>
              <p className="text-xs text-zinc-500 max-w-xs">
                {roomType === 'direct'
                  ? 'Send a 1-on-1 message or share project deliverables.'
                  : 'Start the discussion or share announcements with your team.'}
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            const senderName = msg.profiles?.full_name || msg.profiles?.email || 'Team Member';
            const firstLetter = senderName.charAt(0).toUpperCase();
            const canDelete = isMine || isAdmin;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  isMine ? 'flex-row-reverse' : 'flex-row'
                } group relative`}
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

                    {/* Delete Message Action on Hover */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        disabled={deletingMessageId === msg.id}
                        title="Delete message from database"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all cursor-pointer"
                      >
                        {deletingMessageId === msg.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    )}
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
            placeholder={
              roomType === 'direct'
                ? `Message ${displayRoomTitle}...`
                : `Message ${displayRoomTitle}...`
            }
            className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedFile) || isSending}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-indigo-600/20"
            title="Send message"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* CLEAR CHAT CONFIRMATION MODAL */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-red-500/30 p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Clear All Chat History?</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  This action will permanently delete <strong>all messages and file attachments</strong> in{' '}
                  <span className="text-white font-semibold">{displayRoomTitle}</span> from the database and storage.
                </p>
                <div className="pt-2 text-[11px] text-amber-400/90 font-mono bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                  Storage space in PostgreSQL and cloud storage will be permanently reclaimed.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                disabled={isClearing}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearRoom}
                disabled={isClearing}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-all shadow-lg shadow-red-600/20 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging from DB...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Permanently Clear</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="p-1 rounded-lg text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {isLoadingMembers ? (
                <div className="py-8 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                  <span>Loading channel members...</span>
                </div>
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
              className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
