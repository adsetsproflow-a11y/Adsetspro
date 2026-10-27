'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  CheckCircle,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ExternalLink,
  Layers,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [adminName, setAdminName] = useState('Root Administrator');
  const [adminEmail, setAdminEmail] = useState('owner@adsetsproflow.com');
  const [pendingBadgeCount, setPendingBadgeCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setAdminEmail(user.email || 'owner@adsetsproflow.com');
        if (user.user_metadata?.full_name) {
          setAdminName(user.user_metadata.full_name);
        }

        try {
          const res = await fetch('/api/super-admin/dashboard');
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.stats) {
              setPendingBadgeCount(data.stats.pendingApprovals || 0);
            }
          }
        } catch (err) {
          console.error('Failed to load pending badge count:', err);
        }
      }
    };

    fetchAdminProfile();
  }, [router, supabase, pathname]);

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

  const navItems = [
    { label: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
    { label: 'Companies', href: '/super-admin/companies', icon: Building2 },
    {
      label: 'Pending Approvals',
      href: '/super-admin/approvals',
      icon: CheckCircle,
      badge: pendingBadgeCount > 0 ? pendingBadgeCount : null,
    },
    { label: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
    { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: FileText },
    { label: 'Settings', href: '/super-admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800 relative z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-black text-xs text-white">Adsetspro Flow</h2>
            <span className="text-[9px] uppercase tracking-wider text-red-400 font-mono">
              Super Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop and Mobile Drawer) */}
      <aside
        className={`${
          isMobileMenuOpen ? 'flex' : 'hidden'
        } md:flex w-full md:w-64 bg-zinc-950/95 border-r border-zinc-800/80 p-5 flex-col justify-between shrink-0 shadow-2xl z-40`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="hidden md:block px-2 space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-black text-sm tracking-tight text-white truncate">
                  Adsetspro Flow
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                    Super Admin
                  </span>
                </div>
              </div>
            </div>
            <a
              href="https://www.adsetsproflow.com"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-zinc-500 hover:text-indigo-400 flex items-center gap-1 transition-colors pl-1 pt-1"
            >
              <span>adsetsproflow.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Navigation Links */}
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
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Super Admin Profile card & Logout */}
        <div className="pt-6 border-t border-zinc-800/80 space-y-3">
          <div className="px-3.5 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {adminName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate">{adminName}</p>
              <p className="text-[10px] text-zinc-500 truncate font-mono">{adminEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-zinc-950/70 border-b border-zinc-800/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Platform Control</span>
            <span className="text-xs text-zinc-600">/</span>
            <span className="text-xs font-bold text-zinc-200 tracking-wide">Super Administrator</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
