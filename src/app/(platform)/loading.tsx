import React from 'react';
import CenterLoader from '@/components/common/CenterLoader';

export default function PlatformLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <CenterLoader
        message="Loading Platform Console..."
        subtitle="Retrieving tenant registries and analytics"
        size="lg"
      />
    </div>
  );
}
