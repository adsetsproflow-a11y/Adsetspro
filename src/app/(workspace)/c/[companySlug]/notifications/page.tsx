'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Filter,
  RefreshCw,
  X,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Check,
  Trash2,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: any;
  read_at: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'task' | 'system' | 'chat'>('all');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const qParams = new URLSearchParams();
      qParams.set('filter', activeFilter);
      qParams.set('page', page.toString());
      qParams.set('limit', '15');

      const res = await fetch(`/api/notifications?${qParams.toString()}`);
      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter, page]);

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDeleteNotification = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${notifId}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all your notifications?')) return;
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
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

    // 2. Navigate to relevant page
    const taskId = notif.payload?.task_id;
    if (taskId) {
      if (
        notif.type === 'task_submitted' ||
        notif.type === 'TASK_SUBMITTED'
      ) {
        router.push(`/c/${companySlug}/review/${taskId}`);
      } else {
        router.push(`/c/${companySlug}/tasks/${taskId}`);
      }
      return;
    }

    if (notif.payload?.project_id) {
      router.push(`/c/${companySlug}/projects/${notif.payload.project_id}`);
      return;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'task_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'task_revision_requested':
      case 'revision_required':
        return <RotateCcw className="w-5 h-5 text-orange-400" />;
      case 'task_submitted':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'deadline_warning':
      case 'overdue_task':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'new_comment':
      case 'comment_added':
      case 'mention':
        return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      case 'company_approved':
        return <Building className="w-5 h-5 text-emerald-400" />;
      case 'invitation_accepted':
      case 'invitation_sent':
        return <UserCheck className="w-5 h-5 text-sky-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Notifications Hub
              </h1>
              <p className="text-xs text-zinc-400">
                Deliverable assignments, inspection reviews, comments, and workspace announcements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Mark all as read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          )}

          <button
            onClick={fetchNotifications}
            disabled={isLoading}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Notifications"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2 overflow-x-auto">
        {(['all', 'unread', 'task', 'system', 'chat'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveFilter(tab);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer shrink-0 ${
              activeFilter === tab
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <span>{tab === 'all' ? 'All Alerts' : tab}</span>
            {tab === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 animate-pulse flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-zinc-800/80 rounded w-1/3" />
                  <div className="h-3 bg-zinc-800/40 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 rounded-3xl bg-zinc-900/30 border border-zinc-800/80 text-center space-y-2 shadow-lg">
            <CheckCheck className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-zinc-200 font-bold text-sm">All caught up! No new notifications</p>
            <p className="text-xs text-zinc-500">
              New deliverable assignments, inspection reviews, comments, and alerts will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 group shadow-md ${
                !notif.read_at
                  ? 'bg-zinc-900/80 border-indigo-500/30 hover:border-indigo-500/60'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`p-2.5 rounded-2xl border shrink-0 mt-0.5 ${
                    !notif.read_at
                      ? 'bg-indigo-500/10 border-indigo-500/20'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold transition-colors ${
                        !notif.read_at
                          ? 'text-white group-hover:text-indigo-400'
                          : 'text-zinc-300 group-hover:text-white'
                      }`}
                    >
                      {notif.title}
                    </span>
                    {!notif.read_at && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{notif.body}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-center">
                <span className="text-[11px] font-mono text-zinc-500">
                  {formatTimeAgo(notif.created_at)}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteNotification(notif.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all cursor-pointer"
                  title="Delete notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Showing {notifications.length} of {totalCount} notifications
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 text-white font-semibold transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="font-mono text-zinc-300">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 text-white font-semibold transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
