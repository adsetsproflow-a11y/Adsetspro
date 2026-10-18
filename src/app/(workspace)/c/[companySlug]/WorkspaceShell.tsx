'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building,
  Users,
  UserPlus,
  Briefcase,
  CheckSquare,
  ListTodo,
  CheckCircle,
  MessageSquare,
  Bell,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Layers,
  Award,
  Menu,
  X,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types/app.types';
import NotificationBell from '@/components/layouts/NotificationBell';
import GlobalSearch from '@/components/layouts/GlobalSearch';

interface WorkspaceShellProps {
  children: React.ReactNode;
  companySlug: string;
  companyName: string;
  companyLogo?: string | null;
  userName: string;
  userRole: UserRole;
  unreadNotifications: number;
  isSuperAdmin: boolean;
}

export default function WorkspaceShell({
  children,
  companySlug,
  companyName,
  companyLogo,
  userName,
  userRole,
  unreadNotifications,
  isSuperAdmin,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}
    router.push('/login');
    router.refresh();
  };

  // Define Navigation based strictly on Phase 6 specifications
  const getNavItems = () => {
    const base = `/c/${companySlug}`;

    if (userRole === 'EMPLOYEE') {
      return [
        { label: 'My Tasks', href: `${base}/my-tasks`, icon: ListTodo },
        {
          label: 'Notifications',
          href: `${base}/notifications`,
          icon: Bell,
          badge: unreadNotifications > 0 ? unreadNotifications : null,
        },
        { label: 'My Performance', href: `${base}/performance`, icon: Award },
        { label: 'Settings', href: `${base}/settings`, icon: Settings },
      ];
    }

    if (userRole === 'DEPARTMENT_HEAD') {
      return [
        { label: 'Dashboard', href: `${base}/dashboard`, icon: LayoutDashboard },
        { label: 'Team Members', href: `${base}/employees`, icon: Users },
        { label: 'Department Tasks', href: `${base}/tasks`, icon: CheckSquare },
        { label: 'Review Queue', href: `${base}/review`, icon: CheckCircle },
        { label: 'Department Chat', href: `${base}/chat`, icon: MessageSquare },
        { label: 'Analytics', href: `${base}/analytics`, icon: BarChart3 },
      ];
    }

    // Default: COMPANY_ADMIN (and SUPER_ADMIN)
    return [
      { label: 'Dashboard', href: `${base}/dashboard`, icon: LayoutDashboard },
      { label: 'Departments', href: `${base}/departments`, icon: Building },
      { label: 'Employees', href: `${base}/employees`, icon: Users },
      { label: 'Invitations', href: `${base}/invitations`, icon: UserPlus },
      { label: 'Projects', href: `${base}/projects`, icon: Briefcase },
      { label: 'Tasks', href: `${base}/tasks`, icon: CheckSquare },
      { label: 'Review Queue', href: `${base}/review`, icon: CheckCircle },
      { label: 'Chat', href: `${base}/chat`, icon: MessageSquare },
      { label: 'Analytics', href: `${base}/analytics`, icon: BarChart3 },
      { label: 'Reports', href: `${base}/reports`, icon: FileText },
      { label: 'Settings', href: `${base}/settings`, icon: Settings },
    ];
  };

  const navItems = getNavItems();

  const getRoleBadgeStyle = (role: UserRole) => {
    if (role === 'SUPER_ADMIN') return 'bg-red-500/10 text-red-400 border-red-500/30';
    if (role === 'COMPANY_ADMIN') return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    if (role === 'DEPARTMENT_HEAD') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="w-8 h-8 rounded-lg object-cover border border-zinc-700/50 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          )}
          <div>
            <h2 className="font-bold text-xs text-white truncate max-w-[150px]">{companyName}</h2>
            <span
              className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.2 rounded-full border ${getRoleBadgeStyle(
                userRole
              )}`}
            >
              {userRole.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GlobalSearch companySlug={companySlug} />
          <NotificationBell companySlug={companySlug} />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          isMobileMenuOpen ? 'flex' : 'hidden'
        } md:flex w-full md:w-64 bg-zinc-950/95 border-r border-zinc-800/80 p-5 flex-col justify-between shrink-0 shadow-2xl z-40`}
      >
        <div className="space-y-6">
          {/* Company Brand Header */}
          <div className="px-2 space-y-2">
            <div className="flex items-center gap-3">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="w-10 h-10 rounded-xl object-cover shadow-lg border border-zinc-700/60 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-bold shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-bold text-sm tracking-tight text-white truncate">
                  {companyName}
                </h2>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span
                    className={`text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(
                      userRole
                    )}`}
                  >
                    {userRole.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Bar */}
            <Link
              href={`/c/${companySlug}/notifications`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[11px] font-medium">Notifications</span>
              </div>
              {unreadNotifications > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                  {unreadNotifications} new
                </span>
              ) : (
                <span className="text-[10px] text-zinc-500">All clear</span>
              )}
            </Link>
          </div>

          {/* Role-Specific Navigation Menu */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Sign Out */}
        <div className="pt-6 border-t border-zinc-800/80 space-y-3">
          <div className="px-3.5 py-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate">{userName}</p>
              <p className="text-[10px] text-zinc-500 font-mono truncate">/c/{companySlug}</p>
            </div>
          </div>

          {isSuperAdmin && (
            <Link
              href="/super-admin/dashboard"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Super Admin Portal</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-zinc-950/70 border-b border-zinc-800/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Workspace</span>
            <span className="text-xs text-zinc-600">/</span>
            <span className="text-xs font-bold text-zinc-200 tracking-wide">{companyName}</span>
          </div>

          <div className="flex items-center gap-3">
            <GlobalSearch companySlug={companySlug} />
            <NotificationBell companySlug={companySlug} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
