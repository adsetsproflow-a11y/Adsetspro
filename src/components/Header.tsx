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
} from 'lucide-react';
import { saasStore } from '@/lib/storage';
import { audioEngine } from '@/lib/audio';
import { ThemeToggle } from './ThemeToggle';
import { AuthModal } from './AuthModal';
import { Company, UserProfile } from '@/lib/types';
import { INITIAL_COMPANIES, INITIAL_PROFILES } from '@/lib/seed-data';

interface HeaderProps {
  onOpenEmailCenter: () => void;
  onOpenSuperAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenEmailCenter, onOpenSuperAdmin }) => {
  const [activeCompany, setActiveCompany] = useState<Company>(INITIAL_COMPANIES[0]);
  const [activeUser, setActiveUser] = useState<UserProfile>(INITIAL_PROFILES[2]);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [profiles, setProfiles] = useState<UserProfile[]>(INITIAL_PROFILES);
  const [isMuted, setIsMuted] = useState(false);
  const [alarmTriggeredNotice, setAlarmTriggeredNotice] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Subdomain Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                Adsetspro SaaS
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  Platform
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {activeCompany.subdomain}.domain.com
              </span>
              <span>•</span>
              <span className="capitalize">{activeCompany.plan} Plan</span>
            </div>
          </div>
        </div>

        {/* Tenant & Role Quick Switchers */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Tenant Switcher */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
            <select
              value={activeCompany.id}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer pr-1"
            >
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id} className="dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                  🏢 {comp.name} ({comp.subdomain})
                </option>
              ))}
            </select>
          </div>

          {/* User & Role Switcher */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <UserCheck className="w-4 h-4 text-indigo-500 shrink-0" />
            <select
              value={activeUser.id}
              onChange={(e) => handleUserChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer pr-1"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                  {p.role === 'super_admin' ? '👑' : p.role === 'company_admin' ? '🏢' : p.role === 'team_lead' ? '👔' : '👷'} {p.full_name} ({p.role.replace('_', ' ')} - {p.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Test Alarm Button */}
          <button
            onClick={handleTestAlarm}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
              alarmTriggeredNotice
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Test Web Audio Bell Chime & Alarm Visual"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test Alarm</span>
            {alarmTriggeredNotice && <span className="ml-1 text-[10px]">CHIMING!</span>}
          </button>

          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            title={isMuted ? 'Unmute Audio Chimes' : 'Mute Audio Chimes'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-zinc-400" />}
          </button>

          {/* Automated Email Center (Resend) */}
          <button
            onClick={onOpenEmailCenter}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative"
            title="Automated Email Notification Center (Resend Mock)"
          >
            <Mail className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          </button>

          {/* Urgent Deadlines Notification Indicator */}
          <div className="relative p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
            <Bell className="w-4 h-4" />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-black animate-pulse">
                {urgentCount}
              </span>
            )}
          </div>

          {/* Theme Toggle (Light & Dark) */}
          <ThemeToggle />

          {/* Super Admin Global Control */}
          <button
            onClick={onOpenSuperAdmin}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            title="Adsetspro SaaS Platform Control & Tenant Toggles"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Platform</span>
          </button>

          {/* Sign In / Auth Button */}
          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
            title="Sign In, Register Client Company, or Reset Password"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign In / Register</span>
          </button>

          {/* User Avatar with XP & Streak Badges */}
          <div
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 cursor-pointer hover:opacity-85 transition-opacity"
            title="Click to Switch User / Account"
          >
            <img
              src={activeUser.avatar_url}
              alt={activeUser.full_name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30"
            />
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {activeUser.full_name}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center text-amber-500 font-semibold">
                  <Flame className="w-3 h-3 fill-current" />
                  {activeUser.current_streak}d
                </span>
                <span>•</span>
                <span className="flex items-center text-emerald-500 font-semibold">
                  <Zap className="w-3 h-3 fill-current" />
                  {activeUser.total_xp} XP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal for Login, Register Company, and Reset Password */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </header>
  );
};
