'use client';

import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  FileImage,
  Trophy,
  MessageSquare,
  Sparkles,
  Shield,
  Layers,
  Zap,
  Flame,
  ArrowRight,
  Plus,
  ExternalLink,
  Users,
  Lock,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { AdminBroadcastBanner } from '@/components/AdminBroadcastBanner';
import { TaskTable } from '@/components/TaskTable';
import { TeamManagement } from '@/components/TeamManagement';
import { WebPStudio } from '@/components/WebPStudio';
import { Leaderboard } from '@/components/Leaderboard';
import { ChatSystem } from '@/components/ChatSystem';
import { TaskModal } from '@/components/TaskModal';
import { TaskDrawer } from '@/components/TaskDrawer';
import { EmailNotificationDrawer } from '@/components/EmailNotificationDrawer';
import { SuperAdminDashboard } from '@/components/SuperAdminDashboard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Task } from '@/lib/types';
import { saasStore } from '@/lib/storage';
import { audioEngine } from '@/lib/audio';
import { INITIAL_COMPANIES, INITIAL_PROFILES } from '@/lib/seed-data';

interface WorkspaceViewProps {
  forcedSubdomain?: string;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ forcedSubdomain }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'studio' | 'leaderboard' | 'chat'>('tasks');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | undefined>(undefined);
  const [activeDrawerTask, setActiveDrawerTask] = useState<Task | null>(null);
  const [isEmailCenterOpen, setIsEmailCenterOpen] = useState(false);
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState(false);
  const [activeCompany, setActiveCompany] = useState(INITIAL_COMPANIES[0]);
  const [activeUser, setActiveUser] = useState(INITIAL_PROFILES[2]);
  const [companyEmployeeCount, setCompanyEmployeeCount] = useState(0);

  useEffect(() => {
    saasStore.initData();

    if (forcedSubdomain) {
      const companies = saasStore.getCompanies();
      const matched = companies.find(
        (c) => c.subdomain.toLowerCase() === forcedSubdomain.toLowerCase()
      );
      if (matched) {
        saasStore.setActiveCompanyId(matched.id);
      }
    }

    const update = () => {
      const comp = saasStore.getActiveCompany();
      const user = saasStore.getActiveUser();
      setActiveCompany(comp);
      setActiveUser(user);
      setCompanyEmployeeCount(saasStore.getCompanyProfiles(comp.id).length);
    };
    update();
    const unsub = saasStore.subscribe(update);
    return unsub;
  }, [forcedSubdomain]);

  const handleReactivateCompany = () => {
    saasStore.toggleCompanyStatus(activeCompany.id);
    audioEngine.playSuccessChime();
  };

  const isCompanySuspended = !activeCompany.is_active;
  const isSuperAdmin = activeUser.role === 'super_admin';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#090d16] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Header with Role Switcher, Tenant Switcher, Alarm Tester, Theme Toggle */}
      <Header
        onOpenEmailCenter={() => setIsEmailCenterOpen(true)}
        onOpenSuperAdmin={() => setIsSuperAdminOpen(true)}
      />

      {/* 2. Admin Broadcast Banner (Top Urgent Push Alert) */}
      <AdminBroadcastBanner />

      {/* 3. Suspended Banner for Platform Owner */}
      {isCompanySuspended && isSuperAdmin && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 text-red-600 dark:text-red-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>
                <strong>Platform Owner Override:</strong> This company ({activeCompany.name}) is currently <strong>SUSPENDED (Toggled OFF)</strong>. Client company employees are blocked from accessing features.
              </span>
            </div>
            <button
              onClick={handleReactivateCompany}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Reactivate Company Now</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Workspace Subdomain Welcome Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900/90 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
                {activeCompany.name}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/50 dark:border-indigo-800/50">
                {activeCompany.subdomain}.domain.com
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  activeCompany.is_active
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                }`}
              >
                {activeCompany.is_active ? `${activeCompany.plan} Plan` : 'SUSPENDED'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Active Session: <strong className="text-zinc-800 dark:text-zinc-200">{activeUser.full_name}</strong> ({activeUser.role.replace('_', ' ')} • {activeUser.department})
            </p>
          </div>

          {/* Quick Metrics Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
              <Flame className="w-4 h-4 fill-current text-amber-500" />
              <span>{activeUser.current_streak} Days Streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <Zap className="w-4 h-4 fill-current text-emerald-500" />
              <span>{activeUser.total_xp} Total XP</span>
            </div>
          </div>
        </div>

        {/* 5. SUSPENDED / INACTIVE VIEW (If Toggled OFF and User is NOT Super Admin) */}
        {isCompanySuspended && !isSuperAdmin ? (
          <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/60 rounded-3xl p-8 sm:p-12 text-center shadow-lg space-y-6 max-w-2xl mx-auto my-8">
            <div className="w-20 h-20 rounded-3xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                Workspace Access Paused
              </span>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {activeCompany.name} Workspace is Suspended
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
                The platform owner (<strong>Adsetspro SaaS</strong>) has paused this tenant workspace pending subscription payment or activation. All features (Zoho Task Board, WebP Image Studio, Team Roster, Department Chat) are temporarily locked.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 text-left space-y-1.5 max-w-md mx-auto">
              <div className="flex items-center justify-between font-mono">
                <span>Tenant URL:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{activeCompany.subdomain}.domain.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Account Status:</span>
                <span className="font-bold text-red-600 dark:text-red-400 uppercase">Inactive / Suspended</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Platform Owner:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">Adsetspro SaaS Global Admin</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsSuperAdminOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Super Admin Console (Reactivate)</span>
              </button>

              <button
                onClick={() => {
                  const activeOnes = saasStore.getCompanies().filter((c) => c.is_active);
                  if (activeOnes.length > 0) {
                    saasStore.setActiveCompanyId(activeOnes[0].id);
                    window.location.href = `/workspace/${activeOnes[0].subdomain}`;
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Switch to Active Workspace
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto">
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'tasks'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  <span>Zoho Task Board</span>
                </button>

                {/* Team & Employees Management Tab */}
                <button
                  onClick={() => setActiveTab('team')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'team'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Team & Employees</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold">
                    {companyEmployeeCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('studio')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'studio'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <FileImage className="w-4 h-4" />
                  <span>WebP Studio Engine</span>
                </button>

                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'leaderboard'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Gamified Leaderboard</span>
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Department Chat</span>
                </button>
              </div>

              {activeTab === 'tasks' && (
                <button
                  onClick={() => {
                    setSelectedAssigneeId(undefined);
                    setIsCreateTaskOpen(true);
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Deliverable</span>
                </button>
              )}
            </div>

            {/* Dynamic Tab Views */}
            {activeTab === 'tasks' && (
              <TaskTable
                onOpenCreateTask={() => {
                  setSelectedAssigneeId(undefined);
                  setIsCreateTaskOpen(true);
                }}
                onOpenTaskDiscussion={(task) => setActiveDrawerTask(task)}
              />
            )}

            {activeTab === 'team' && (
              <TeamManagement
                onAssignTaskToEmployee={(empId) => {
                  setSelectedAssigneeId(empId);
                  setIsCreateTaskOpen(true);
                }}
              />
            )}

            {activeTab === 'studio' && <WebPStudio />}

            {activeTab === 'leaderboard' && <Leaderboard />}

            {activeTab === 'chat' && <ChatSystem />}
          </>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>
              Adsetspro SaaS Platform • Zoho Projects Table + ClickUp Speed + WebP Deliverables
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => setIsEmailCenterOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 underline cursor-pointer"
            >
              Resend Email Log
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSuperAdminOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 underline cursor-pointer"
            >
              Super Admin Console
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-over Drawers */}
      <TaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => {
          setIsCreateTaskOpen(false);
          setSelectedAssigneeId(undefined);
        }}
        initialAssigneeId={selectedAssigneeId}
      />

      <TaskDrawer
        task={activeDrawerTask}
        onClose={() => setActiveDrawerTask(null)}
      />

      <EmailNotificationDrawer
        isOpen={isEmailCenterOpen}
        onClose={() => setIsEmailCenterOpen(false)}
      />

      <SuperAdminDashboard
        isOpen={isSuperAdminOpen}
        onClose={() => setIsSuperAdminOpen(false)}
      />
    </div>
  );
};
