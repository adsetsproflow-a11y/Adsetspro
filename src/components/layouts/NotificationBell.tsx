'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  Building,
  UserCheck,
  Mail,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: any;
  read_at: string | null;
  created_at: string;
}

interface NotificationBellProps {
  companySlug?: string;
}

export default function NotificationBell({ companySlug }: NotificationBellProps) {
  const router = useRouter();
  const supabase = createClient();
  const panelRef = useRef<HTMLDivElement>(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  const fetchLatestNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=10');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications in bell:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestNotifications();

    let channel: any = null;
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !isMounted) return;

        const topic = `user-notifications-${user.id}`;

        // Clean up any stale channels with matching topic
        try {
          const channels = supabase.getChannels();
          for (const ch of channels) {
            if (ch.topic.includes(topic)) {
              supabase.removeChannel(ch);
            }
          }
        } catch {}

        if (!isMounted) return;

        channel = supabase
          .channel(`${topic}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!isMounted) return;
              const newNotif = payload.new as NotificationItem;
              setUnreadCount((prev) => prev + 1);
              setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);

              // Trigger Realtime In-App Toast
              setToast({ title: newNotif.title, body: newNotif.body });
              setTimeout(() => {
                if (isMounted) setToast(null);
              }, 4500);
            }
          );

        channel.subscribe();
      } catch (err) {
        console.warn('Realtime notifications notice:', err);
      }
    };

    setupRealtime();

    // Polling fallback to keep notifications updated
    const interval = setInterval(() => {
      if (isMounted) {
        fetchLatestNotifications();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    // 1. Mark as read if not already read
    if (!notif.read_at) {
      fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' }).catch(console.error);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    }

    setIsOpen(false);

    // 2. Resolve destination route from payload
    const taskId = notif.payload?.task_id;
    const baseSlug = companySlug || 'default';

    if (taskId) {
      if (
        notif.type === 'task_submitted' ||
        notif.type === 'TASK_SUBMITTED'
      ) {
        router.push(`/c/${baseSlug}/review/${taskId}`);
      } else {
        router.push(`/c/${baseSlug}/tasks/${taskId}`);
      }
      return;
    }

    if (companySlug) {
      router.push(`/c/${companySlug}/notifications`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'task_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'task_revision_requested':
      case 'revision_required':
        return <RotateCcw className="w-4 h-4 text-orange-400" />;
      case 'task_submitted':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'deadline_warning':
      case 'overdue_task':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'new_comment':
      case 'comment_added':
      case 'mention':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'company_approved':
        return <Building className="w-4 h-4 text-emerald-400" />;
      case 'invitation_accepted':
      case 'invitation_sent':
        return <UserCheck className="w-4 h-4 text-sky-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const notificationsUrl = companySlug ? `/c/${companySlug}/notifications` : '/notifications';

  return (
    <div className="relative" ref={panelRef}>
      {/* BELL TRIGGER BUTTON */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchLatestNotifications();
          }
        }}
        className="relative p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-md"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-zinc-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN NOTIFICATIONS PANEL */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-zinc-950/95 border border-zinc-800/90 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications Feed */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-900">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center space-y-1.5 px-4">
                <Bell className="w-6 h-6 text-zinc-600 mx-auto" />
                <p className="text-xs font-semibold text-zinc-300">No notifications yet</p>
                <p className="text-[11px] text-zinc-500">
                  When deliverables or system updates happen, they will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-zinc-900/60 transition-colors cursor-pointer flex items-start gap-3 group ${
                    !notif.read_at ? 'bg-indigo-500/5' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate block group-hover:text-indigo-400 transition-colors">
                        {notif.title}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                        {formatTimeAgo(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {notif.body}
                    </p>
                  </div>
                  {!notif.read_at && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Link */}
          <div className="p-3 bg-zinc-900/50 border-t border-zinc-800/80 text-center">
            <Link
              href={notificationsUrl}
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5"
            >
              <span>View all notifications</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* REALTIME TOAST ALERT POPUP */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl bg-zinc-950 border border-indigo-500/40 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-xs font-bold text-white block">{toast.title}</span>
              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                {toast.body}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-zinc-500 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
