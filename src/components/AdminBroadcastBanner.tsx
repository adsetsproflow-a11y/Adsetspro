'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, BellRing, X } from 'lucide-react';
import { saasStore } from '@/lib/storage';
import { AdminBroadcast, UserProfile } from '@/lib/types';
import { audioEngine } from '@/lib/audio';

export const AdminBroadcastBanner: React.FC = () => {
  const [broadcast, setBroadcast] = useState<AdminBroadcast | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile>(saasStore.getActiveUser());

  useEffect(() => {
    setBroadcast(saasStore.getBroadcast());
    setCurrentUser(saasStore.getActiveUser());

    const unsubscribe = saasStore.subscribe(() => {
      setBroadcast(saasStore.getBroadcast());
      setCurrentUser(saasStore.getActiveUser());
    });
    return unsubscribe;
  }, []);

  if (!broadcast) return null;

  const hasAcknowledged = broadcast.acknowledged_by.includes(currentUser.id);
  const isSender = currentUser.role === 'company_admin' || currentUser.role === 'super_admin';

  const handleAcknowledge = () => {
    saasStore.acknowledgeBroadcast(currentUser.id);
    audioEngine.playBellChime();
  };

  const handleDismiss = () => {
    saasStore.clearBroadcast();
  };

  return (
    <div className="relative z-50 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-xl alarm-pulse-urgent border-b border-red-500/40">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5 text-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-white text-red-700 px-2 py-0.5 rounded shadow-sm">
                URGENT ADMIN BROADCAST
              </span>
              <span className="text-xs text-red-100 font-medium">
                Sent by {broadcast.sender_name}
              </span>
            </div>
            <p className="text-sm font-semibold tracking-wide mt-0.5">
              {broadcast.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!hasAcknowledged ? (
            <button
              onClick={handleAcknowledge}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-700 font-bold text-xs rounded-lg hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Acknowledge Alert
            </button>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-emerald-700/80 text-white px-2.5 py-1 rounded-md font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Acknowledged
            </span>
          )}

          {isSender && (
            <button
              onClick={handleDismiss}
              title="Clear broadcast for all"
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
