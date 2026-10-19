import React from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { UserRole } from '@/types/app.types';
import { getDbPool } from '@/lib/db';
import WorkspaceShell from './WorkspaceShell';

function ForbiddenScreen({
  title,
  message,
  companyName,
}: {
  title: string;
  message: string;
  companyName?: string;
}) {
  return (
    <div className="min-h-screen bg-[#070b14] text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            403 Forbidden
          </span>
          <h1 className="text-xl font-black text-white">{title}</h1>
          {companyName && (
            <p className="text-xs font-semibold text-zinc-300">
              Workspace: <span className="text-indigo-400">{companyName}</span>
            </p>
          )}
          <p className="text-xs text-zinc-400 leading-relaxed pt-1">{message}</p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/login"
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-200 inline-flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Login</span>
          </Link>
          <a
            href="https://www.adsetsproflow.com"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1 transition-colors"
          >
            <span>Adsetspro Flow Platform</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const supabase = await createClient();

  // 1. Validate session & user authentication server-side
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Fetch user profile
  const pool = getDbPool();
  const profRes = await pool.query(
    `SELECT id, full_name, email, is_super_admin FROM public.profiles WHERE id = $1 LIMIT 1;`,
    [user.id]
  );
  const profile = profRes.rows[0];

  if (!profile) {
    redirect('/login');
  }

  // 3. Fetch company
  const compRes = await pool.query(
    `SELECT id, name, slug, status, logo_url FROM public.companies WHERE slug = $1 LIMIT 1;`,
    [companySlug]
  );
  const company = compRes.rows[0];

  if (!company) {
    return (
      <ForbiddenScreen
        title="Access Denied"
        message="The workspace you are attempting to access does not exist or your account does not have permission to view it."
      />
    );
  }

  // 4. Validate Company Approval Status
  if (company.status !== 'approved' && !profile.is_super_admin) {
    return (
      <ForbiddenScreen
        title="Workspace Pending Approval"
        companyName={company.name}
        message="This enterprise organization workspace is currently awaiting verification and authorization by the platform Super Administrator. Please check back shortly or contact your workspace administrator."
      />
    );
  }

  // 5. Validate User Membership in this Company
  let role: UserRole = 'EMPLOYEE';
  if (profile.is_super_admin) {
    role = 'SUPER_ADMIN';
  } else {
    const memRes = await pool.query(
      `SELECT role, status FROM public.company_memberships WHERE user_id = $1 AND company_id = $2 AND status = 'active' LIMIT 1;`,
      [user.id, company.id]
    );
    const membership = memRes.rows[0];

    if (!membership) {
      return (
        <ForbiddenScreen
          title="Access Unauthorized"
          companyName={company.name}
          message="You do not have an active membership for this workspace organization. Please request an invitation from your company administrator."
        />
      );
    }

    role = membership.role as UserRole;
  }

  // 6. Fetch unread notifications count
  const notifRes = await pool.query(
    `SELECT COUNT(*)::int as count FROM public.notifications WHERE user_id = $1 AND read_at IS NULL;`,
    [user.id]
  );
  const unreadCount = notifRes.rows[0]?.count || 0;

  return (
    <WorkspaceShell
      companySlug={companySlug}
      companyName={company.name}
      companyLogo={company.logo_url || null}
      userName={profile.full_name || profile.email}
      userRole={role}
      unreadNotifications={unreadCount || 0}
      isSuperAdmin={Boolean(profile.is_super_admin)}
    >
      {children}
    </WorkspaceShell>
  );
}
