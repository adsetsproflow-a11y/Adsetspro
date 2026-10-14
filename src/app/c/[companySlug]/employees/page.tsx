import React, { Suspense } from 'react';
import { CompanyWorkspaceShell } from '@/components/CompanyWorkspaceShell';

export function generateStaticParams() {
  return [{ companySlug: 'apex' }, { companySlug: 'techflow' }];
}

interface PageProps {
  params: Promise<{ companySlug: string }>;
}

export default async function CompanyEmployeesPage({ params }: PageProps) {
  const { companySlug } = await params;

  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 text-xs font-semibold">Loading employees...</div>}>
      <CompanyWorkspaceShell companySlug={companySlug} defaultTab="employees" />
    </Suspense>
  );
}
