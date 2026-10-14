import React from 'react';
import { CompanyWorkspaceShell } from '@/components/CompanyWorkspaceShell';

interface PageProps {
  params: Promise<{ companySlug: string }>;
}

export default async function CompanySettingsPage({ params }: PageProps) {
  const { companySlug } = await params;

  return <CompanyWorkspaceShell companySlug={companySlug} defaultTab="settings" />;
}
