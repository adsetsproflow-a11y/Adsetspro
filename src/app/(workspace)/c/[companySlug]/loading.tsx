import React from 'react';
import CenterLoader from '@/components/common/CenterLoader';

export default function WorkspaceLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <CenterLoader
        message="Loading workspace..."
        subtitle="Initializing organization modules and data"
        size="lg"
      />
    </div>
  );
}
