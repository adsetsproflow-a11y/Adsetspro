'use client';

import React from 'react';
import { SuperAdminPortalView } from '@/components/SuperAdminPortalView';

export default function SuperAdminAuditLogsPage() {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/login';
  };

  return <SuperAdminPortalView onLogout={handleLogout} />;
}
