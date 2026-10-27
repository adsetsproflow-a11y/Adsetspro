import React from 'react';
import CenterLoader from '@/components/common/CenterLoader';

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-[#070b14]">
      <CenterLoader
        message="Loading..."
        subtitle="Connecting to Adsetspro Flow"
        size="lg"
      />
    </div>
  );
}
