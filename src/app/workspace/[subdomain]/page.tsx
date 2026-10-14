import { Suspense } from 'react';
import { TenantWorkspaceClient } from '@/components/TenantWorkspaceClient';

export function generateStaticParams() {
  return [{ subdomain: 'apex' }, { subdomain: 'techflow' }, { subdomain: 'pulse' }];
}

export default async function WorkspaceSubdomainPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400">Loading {subdomain} workspace...</div>}>
      <TenantWorkspaceClient subdomain={subdomain} />
    </Suspense>
  );
}
