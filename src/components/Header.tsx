'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Play,
  Building2,
  UserCheck,
  Flame,
  Zap,
  Mail,
  Shield,
  Layers,
  LogIn,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { saasStore } from '@/lib/storage';
import { authService } from '@/lib/auth';
import { audioEngine } from '@/lib/audio';
import { ThemeToggle } from './ThemeToggle';
import { AuthModal } from './AuthModal';
import { Company, UserProfile } from '@/lib/types';
import { INITIAL_COMPANIES, INITIAL_PROFILES } from '@/lib/seed-data';

interface HeaderProps {
  onOpenEmailCenter: () => void;
  onOpenSuperAdmin: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenEmailCenter, onOpenSuperAdmin, onLogout }) => {
  const [activeCompany, setActiveCompany] = useState<Company>(INITIAL_COMPANIES[0]);
  const [activeUser, setActiveUser] = useState<UserProfile>(INITIAL_PROFILES[2]);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [profiles, setProfiles] = useState<UserProfile[]>(INITIAL_PROFILES);
  const [isMuted, setIsMuted] = useState(false);
  const [alarmTriggeredNotice, setAlarmTriggeredNotice] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setActiveCompany(saasStore.getActiveCompany());
    setActiveUser(saasStore.getActiveUser());
    setCompanies(saasStore.getCompanies());
    setProfiles(saasStore.getProfiles());

    const unsubscribe = saasStore.subscribe(() => {
      setActiveCompany(saasStore.getActiveCompany());
      setActiveUser(saasStore.getActiveUser());
      setCompanies(saasStore.getCompanies());
      setProfiles(saasStore.getProfiles());
    });
    return unsubscribe;
  }, []);

  const handleCompanyChange = (compId: string) => {
    saasStore.setActiveCompanyId(compId);
    const comp = companies.find((c) => c.id === compId);
    if (comp && typeof window !== 'undefined') {
      window.history.pushState({}, '', `/workspace/${comp.subdomain}`);
    }
    audioEngine.playBellChime();
  };

  const handleUserChange = (userId: string) => {
    saasStore.setActiveUserId(userId);
    audioEngine.playBellChime();
  };

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    audioEngine.setMuted(nextState);
  };

  const handleTestAlarm = () => {
    audioEngine.playUrgentAlert();
    setAlarmTriggeredNotice(true);
    setTimeout(() => {
      setAlarmTriggeredNotice(false);
    }, 3500);
  };

  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    const updateUrgent = () => {
      const tasks = saasStore.getCompanyTasks(activeCompany.id);
      const now = Date.now();
      const count = tasks.filter((t) => {
        if (t.status === 'completed') return false;
        const diff = new Date(t.due_date).getTime() - now;
        return diff <= 60 * 60 * 1000;
      }).length;
      setUrgentCount(count);
    };
    updateUrgent();
  }, [activeCompany.id]);

  const handleLogoutClick = () => {
    authService.logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors">
      <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-2 lg:gap-4">
        {/* Left: Brand & Subdomain Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                Adsetspro SaaS
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider hidden sm:inline">
                Platform
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[130px] sm:max-w-none">
                {activeCompany.name} ({activeCompany.subdomain})
              </span>
            </div>
          </div>
        </div>

        {/* Center: Tenant & User Quick Switchers (Only on xl+ screens with compact max-widths to prevent any overflow) */}
        <div className="hidden xl:flex items-center gap-2 shrink-0">
          {/* Tenant Switcher: ONLY VISIBLE TO SUPER ADMIN */}
          {activeUser.role === 'super_admin' ? (
            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs">
              <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 shrink-0">
                👑 Super Admin
              </span>
              <select
                value={activeCompany.id}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer max-w-[140px] truncate"
                title="Super Admin Cross-Tenant Switcher"
              >
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id} className="dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                    🏢 {comp.name} {comp.is_active ? '' : '(SUSPENDED)'}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* Client Company Users see ONLY their company (Strict Isolation) */
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="max-w-[130px] truncate">{activeCompany.name}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-zinc-500 dark:text-zinc-400">
                {activeCompany.subdomain}
              </span>
            </div>
          )}

          {/* User & Role Switcher */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <select
              value={activeUser.id}
              onChange={(e) => handleUserChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer max-w-[130px] truncate"
              title="Switch Active User Profile"
            >
              {(activeUser.role === 'super_admin'
                ? profiles
                : profiles.filter((p) => p.company_id === activeCompany.id)
              ).map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Action Bar (Guaranteed to fit seamlessly on all laptop & desktop screens) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Test Alarm Button */}
          <button
            onClick={handleTestAlarm}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0 ${
              alarmTriggeredNotice
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Test Web Audio Bell Chime & Alarm Visual"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden lg:inline">Test Alarm</span>
            {alarmTriggeredNotice && <span className="ml-0.5 text-[10px]">CHIMING!</span>}
          </button>

          {/* Grouped Utility Pill: Audio Mute, Email Drawer, Urgent Bell */}
          <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            {/* Audio Mute/Unmute */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio Chimes' : 'Mute Audio Chimes'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-zinc-400" />}
            </button>

            {/* Automated Email Center */}
            <button
              onClick={onOpenEmailCenter}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors relative cursor-pointer"
              title="Automated Email Notification Center"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="absolute 0.5 top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            </button>

            {/* Urgent Deadlines Notification Indicator */}
            <div
              className="relative p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400"
              title={`${urgentCount} Urgent Deadlines Overdue or Impending`}
            >
              <Bell className="w-3.5 h-3.5" />
              {urgentCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 px-1 py-0.1 bg-red-500 text-white rounded-full text-[9px] font-black animate-pulse leading-none">
                  {urgentCount}
                </span>
              )}
            </div>
          </div>

          {/* Theme Toggle (Light & Dark) */}
          <div className="shrink-0">
            <ThemeToggle />
          </div>

          {/* Super Admin Global Control Button (ONLY for Platform Owner) */}
          {activeUser.role === 'super_admin' && (
            <button
              onClick={onOpenSuperAdmin}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20 border-transparent"
              title="Adsetspro SaaS Platform Control & Tenant Management"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Super Admin</span>
            </button>
          )}

          {/* Log Out Button (ALWAYS VISIBLE, NEVER PUSHED OFF) */}
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer shrink-0"
            title="Log Out and return to Login Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>

          {/* User Avatar (Clickable to switch accounts / profiles) */}
          <div
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-zinc-200 dark:border-zinc-800 cursor-pointer hover:opacity-85 transition-opacity shrink-0"
            title="Click to Switch User / Account"
          >
            <img
              src={activeUser.avatar_url}
              alt={activeUser.full_name}
              className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/30 shrink-0"
            />
            <div className="hidden 2xl:block text-left">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight flex items-center gap-1">
                <span className="max-w-[110px] truncate">{activeUser.full_name}</span>
                {activeUser.employee_id && (
                  <span className="text-[9px] font-mono px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {activeUser.employee_id}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[80px]">
                  {activeUser.designation || activeUser.role.replace('_', ' ')}
                </span>
                <span>•</span>
                <span className="flex items-center text-emerald-500 font-semibold">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  {activeUser.total_xp}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile / Tablet Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 xl:hidden cursor-pointer shrink-0"
            title="Toggle Quick Navigation"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Expandable Secondary Bar */}
      {isMobileMenuOpen && (
        <div className="xl:hidden border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-900/95 px-4 py-3 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Super Admin Tenant Switcher on Mobile/Tablet */}
            {activeUser.role === 'super_admin' ? (
              <div className="flex-1 flex items-center justify-between gap-2 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs">
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300">
                  👑 Active Tenant
                </span>
                <select
                  value={activeCompany.id}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                >
                  {companies.map((comp) => (
                    <option key={comp.id} value={comp.id} className="dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                      🏢 {comp.name} {comp.is_active ? '' : '(SUSPENDED)'}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between gap-2 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                  {activeCompany.name}
                </span>
                <span className="font-mono text-[10px] text-zinc-400">
                  {activeCompany.subdomain}.domain.com
                </span>
              </div>
            )}

            {/* Profile Switcher on Mobile/Tablet */}
            <div className="flex-1 flex items-center justify-between gap-2 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-2 rounded-xl text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-600 dark:text-zinc-400">
                <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                Active User
              </span>
              <select
                value={activeUser.id}
                onChange={(e) => handleUserChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                {(activeUser.role === 'super_admin'
                  ? profiles
                  : profiles.filter((p) => p.company_id === activeCompany.id)
                ).map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                    {p.full_name} ({p.designation || p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-zinc-500 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <span className="flex items-center gap-1">
              Logged in as: <strong className="text-zinc-800 dark:text-zinc-200">{activeUser.full_name}</strong>
              {activeUser.employee_id && <code className="ml-1 text-[10px] px-1 bg-zinc-200 dark:bg-zinc-800 rounded">{activeUser.employee_id}</code>}
            </span>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Switch Account
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal for Login, Register Company, and Reset Password */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </header>
  );
};
