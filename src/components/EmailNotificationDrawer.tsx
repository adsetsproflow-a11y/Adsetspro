'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle2, Send, Code, Eye, RefreshCw } from 'lucide-react';
import { saasStore } from '@/lib/storage';
import { EmailNotification } from '@/lib/types';

interface EmailNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailNotificationDrawer: React.FC<EmailNotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'payload'>('preview');

  useEffect(() => {
    const update = () => {
      const list = saasStore.getEmails();
      setEmails(list);
      if (list.length > 0 && !selectedEmail) {
        setSelectedEmail(list[0]);
      }
    };
    update();
    const unsub = saasStore.subscribe(update);
    return unsub;
  }, [isOpen, selectedEmail]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Automated Email Center
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Resend API Engine
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Live inspection of automated email alerts sent to workers and leads.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Split view of email log & preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Email list */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            {emails.map((em) => (
              <button
                key={em.id}
                onClick={() => setSelectedEmail(em)}
                className={`w-full text-left p-3.5 transition-colors cursor-pointer block ${
                  selectedEmail?.id === em.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-l-4 border-l-indigo-600'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    {em.type.replace('_', ' ')}
                  </span>
                  <span>
                    {new Date(em.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 line-clamp-1">
                  {em.subject}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  To: {em.recipient_name}
                </div>
              </button>
            ))}
          </div>

          {/* Email preview pane */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
            {selectedEmail ? (
              <>
                {/* Mode toggle */}
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/75 dark:bg-zinc-950/75">
                  <div className="text-xs">
                    <span className="text-zinc-400">Recipient: </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {selectedEmail.recipient_email}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                        viewMode === 'preview'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                    <button
                      onClick={() => setViewMode('payload')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                        viewMode === 'payload'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Code className="w-3 h-3" />
                      Resend API
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-5 overflow-y-auto">
                  {viewMode === 'preview' ? (
                    <div
                      className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-950 shadow-inner"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.html_preview }}
                    />
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-zinc-500">
                        // Resend API Dispatch Snippet:
                      </div>
                      <pre className="p-4 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-zinc-800">
{`const { data, error } = await resend.emails.send({
  from: '${selectedEmail.payload.from}',
  to: '${selectedEmail.payload.to}',
  subject: '${selectedEmail.payload.subject}',
  tags: ${JSON.stringify(selectedEmail.payload.tags, null, 2)},
  html: \`...HTML Template Rendered...\`
});`}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-zinc-400 text-xs">
                Select an email notification to inspect.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
