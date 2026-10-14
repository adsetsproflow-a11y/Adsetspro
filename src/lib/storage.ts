import {
  Company,
  UserProfile,
  Task,
  Message,
  AdminBroadcast,
  PointsHistory,
  EmailNotification,
  TaskStatus,
  TaskPriority,
  Department,
  TaskAttachment,
} from './types';
import {
  INITIAL_COMPANIES,
  INITIAL_PROFILES,
  INITIAL_TASKS,
  INITIAL_MESSAGES,
  INITIAL_BROADCAST,
  INITIAL_POINTS_HISTORY,
  INITIAL_EMAILS,
} from './seed-data';
import { audioEngine } from './audio';

const STORAGE_KEYS = {
  COMPANIES: 'saas_pm_companies',
  PROFILES: 'saas_pm_profiles',
  TASKS: 'saas_pm_tasks',
  MESSAGES: 'saas_pm_messages',
  BROADCAST: 'saas_pm_broadcast',
  POINTS: 'saas_pm_points',
  EMAILS: 'saas_pm_emails',
  ACTIVE_COMPANY_ID: 'saas_pm_active_comp_id',
  ACTIVE_USER_ID: 'saas_pm_active_user_id',
  THEME: 'saas_pm_theme',
};

export class SaaSStore {
  private static instance: SaaSStore;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initData();
    }
  }

  public static getInstance(): SaaSStore {
    if (!SaaSStore.instance) {
      SaaSStore.instance = new SaaSStore();
    }
    return SaaSStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  public initData(forceReset = false) {
    if (typeof window === 'undefined') return;

    const existingCompanies = this.getCompanies();
    const needsReset = !existingCompanies.some((c) => c.subdomain === 'apex');

    if (forceReset || needsReset || !localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
      const clientNow = Date.now();
      const dynamicTasks = INITIAL_TASKS.map((t, idx) => {
        if (idx === 0) return { ...t, due_date: new Date(clientNow + 42 * 60 * 1000).toISOString() };
        if (idx === 1) return { ...t, due_date: new Date(clientNow - 25 * 60 * 1000).toISOString() };
        if (idx === 2) return { ...t, due_date: new Date(clientNow + 240 * 60 * 1000).toISOString() };
        return t;
      });
      this.setItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
      this.setItem(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
      this.setItem(STORAGE_KEYS.TASKS, dynamicTasks);
      this.setItem(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
      this.setItem(STORAGE_KEYS.BROADCAST, INITIAL_BROADCAST);
      this.setItem(STORAGE_KEYS.POINTS, INITIAL_POINTS_HISTORY);
      this.setItem(STORAGE_KEYS.EMAILS, INITIAL_EMAILS);
      this.setItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, 'comp-apex');
      this.setItem(STORAGE_KEYS.ACTIVE_USER_ID, 'user-sarah'); // Default to Company Admin
      this.setItem(STORAGE_KEYS.THEME, this.getTheme() || 'dark');
    }
  }

  // --- Active Session ---
  public getActiveCompanyId(): string {
    return this.getItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, 'comp-apex');
  }

  public setActiveCompanyId(id: string) {
    this.setItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, id);
    // Find default user for this company
    const profiles = this.getProfiles().filter((p) => p.company_id === id);
    if (profiles.length > 0) {
      this.setActiveUserId(profiles[0].id);
    }
  }

  public getActiveUserId(): string {
    return this.getItem(STORAGE_KEYS.ACTIVE_USER_ID, 'user-elena');
  }

  public setActiveUserId(id: string) {
    this.setItem(STORAGE_KEYS.ACTIVE_USER_ID, id);
  }

  public getActiveCompany(): Company {
    const compId = this.getActiveCompanyId();
    const companies = this.getCompanies();
    return companies.find((c) => c.id === compId) || companies[0] || INITIAL_COMPANIES[0];
  }

  public getActiveUser(): UserProfile {
    const userId = this.getActiveUserId();
    const profiles = this.getProfiles();
    return profiles.find((p) => p.id === userId) || profiles[0] || INITIAL_PROFILES[0];
  }

  // --- Theme ---
  public getTheme(): 'dark' | 'light' {
    return this.getItem(STORAGE_KEYS.THEME, 'dark');
  }

  public setTheme(theme: 'dark' | 'light') {
    this.setItem(STORAGE_KEYS.THEME, theme);
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
  }

  // --- Companies ---
  public getCompanies(): Company[] {
    return this.getItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
  }

  public addCompany(comp: Omit<Company, 'id' | 'created_at'>): Company {
    const companies = this.getCompanies();
    const newComp: Company = {
      ...comp,
      id: `comp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.COMPANIES, [...companies, newComp]);
    return newComp;
  }

  public toggleCompanyStatus(id: string) {
    const companies = this.getCompanies();
    const updated = companies.map((c) => {
      if (c.id === id) {
        const nextActive = !c.is_active;
        return {
          ...c,
          is_active: nextActive,
          approval_status: nextActive ? ('approved' as const) : ('suspended' as const),
        };
      }
      return c;
    });
    this.setItem(STORAGE_KEYS.COMPANIES, updated);
  }

  public approveCompanyCredentials(id: string) {
    const companies = this.getCompanies();
    const updated = companies.map((c) =>
      c.id === id ? { ...c, is_active: true, approval_status: 'approved' as const } : c
    );
    this.setItem(STORAGE_KEYS.COMPANIES, updated);
  }

  public deleteCompany(id: string): void {
    const companies = this.getCompanies().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.COMPANIES, companies);

    const profiles = this.getProfiles().filter((p) => p.company_id !== id);
    this.setItem(STORAGE_KEYS.PROFILES, profiles);

    const tasks = this.getTasks().filter((t) => t.company_id !== id);
    this.setItem(STORAGE_KEYS.TASKS, tasks);

    const messages = this.getMessages().filter((m) => m.company_id !== id);
    this.setItem(STORAGE_KEYS.MESSAGES, messages);

    const points = this.getPointsHistory().filter((p) => p.company_id !== id);
    this.setItem(STORAGE_KEYS.POINTS, points);

    if (this.getActiveCompanyId() === id) {
      if (companies.length > 0) {
        this.setActiveCompanyId(companies[0].id);
      }
    }
  }

  // --- Profiles ---
  public getProfiles(): UserProfile[] {
    return this.getItem(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }

  public getCompanyProfiles(companyId?: string): UserProfile[] {
    const cid = companyId || this.getActiveCompanyId();
    return this.getProfiles().filter((p) => p.company_id === cid);
  }

  public addProfile(profile: UserProfile): void {
    const profiles = this.getProfiles();
    this.setItem(STORAGE_KEYS.PROFILES, [...profiles, profile]);
  }

  public deleteProfile(profileId: string): void {
    const profiles = this.getProfiles();
    this.setItem(STORAGE_KEYS.PROFILES, profiles.filter((p) => p.id !== profileId));
  }

  public updateProfile(profileId: string, updates: Partial<UserProfile>): void {
    const profiles = this.getProfiles();
    this.setItem(
      STORAGE_KEYS.PROFILES,
      profiles.map((p) => (p.id === profileId ? { ...p, ...updates } : p))
    );
  }

  // --- Tasks ---
  public getTasks(): Task[] {
    return this.getItem(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  }

  public getCompanyTasks(companyId?: string): Task[] {
    const cid = companyId || this.getActiveCompanyId();
    return this.getTasks().filter((t) => t.company_id === cid);
  }

  public addTask(taskData: Omit<Task, 'id' | 'created_at' | 'time_spent_seconds' | 'is_timer_running'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      created_at: new Date().toISOString(),
      time_spent_seconds: 0,
      is_timer_running: false,
      attachments: [],
    };
    this.setItem(STORAGE_KEYS.TASKS, [newTask, ...tasks]);

    // Audio Chime on new task assignment
    audioEngine.playBellChime();

    // Log Automated Email Notification (Resend integration)
    const assignedUser = this.getProfiles().find((p) => p.id === newTask.assigned_to);
    if (assignedUser) {
      this.logEmailNotification({
        recipient_email: assignedUser.email,
        recipient_name: assignedUser.full_name,
        subject: `[New Task] ${newTask.title} (${newTask.priority.toUpperCase()})`,
        type: 'task_assigned',
        status: 'delivered',
        html_preview: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:10px;">
            <h2 style="color:#4f46e5;margin:0 0 12px 0;">⚡ New Task Assigned</h2>
            <p>Hi ${assignedUser.full_name},</p>
            <p>You have been assigned <strong>${newTask.title}</strong> in ${newTask.department}.</p>
            <p>Priority: <strong>${newTask.priority.toUpperCase()}</strong> • Reward: <strong>+${newTask.reward_xp} XP</strong></p>
            <p>Due: <strong>${new Date(newTask.due_date).toLocaleString()}</strong></p>
          </div>
        `,
        payload: {
          from: 'SaaS Notifications <notifications@saaspm.local>',
          to: assignedUser.email,
          subject: `[New Task] ${newTask.title}`,
          tags: [{ name: 'task_id', value: newTask.id }],
        },
      });
    }

    return newTask;
  }

  public updateTaskStatus(taskId: string, newStatus: TaskStatus): void {
    const tasks = this.getTasks();
    let completedWorkerId: string | null = null;
    let earnedXp = 100;
    let taskTitle = '';

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        taskTitle = t.title;
        earnedXp = t.reward_xp || 100;
        if (newStatus === 'completed' && t.status !== 'completed') {
          completedWorkerId = t.assigned_to;
          return {
            ...t,
            status: newStatus,
            completed_at: new Date().toISOString(),
            is_timer_running: false,
          };
        }
        return {
          ...t,
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    this.setItem(STORAGE_KEYS.TASKS, updated);

    // If marked completed: award XP, increment streak, play celebratory chime!
    if (completedWorkerId && newStatus === 'completed') {
      audioEngine.playSuccessChime();
      this.awardXP(completedWorkerId, earnedXp, 'task_completed', taskId, taskTitle);
    } else {
      audioEngine.playBellChime();
    }
  }

  public toggleTaskTimer(taskId: string) {
    const tasks = this.getTasks();
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, is_timer_running: !t.is_timer_running };
      }
      return t;
    });
    this.setItem(STORAGE_KEYS.TASKS, updated);
  }

  public incrementActiveTimers() {
    const tasks = this.getTasks();
    let hasRunning = false;
    const updated = tasks.map((t) => {
      if (t.is_timer_running && t.status !== 'completed') {
        hasRunning = true;
        return {
          ...t,
          time_spent_seconds: (t.time_spent_seconds || 0) + 1,
        };
      }
      return t;
    });
    if (hasRunning) {
      this.setItem(STORAGE_KEYS.TASKS, updated);
    }
  }

  public deleteTask(taskId: string) {
    const tasks = this.getTasks();
    this.setItem(
      STORAGE_KEYS.TASKS,
      tasks.filter((t) => t.id !== taskId)
    );
  }

  public attachDeliverableToTask(taskId: string, attachment: Omit<TaskAttachment, 'id' | 'created_at' | 'task_id' | 'company_id'>) {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newAttachment: TaskAttachment = {
      ...attachment,
      id: `att-${Date.now()}`,
      task_id: taskId,
      company_id: task.company_id,
      created_at: new Date().toISOString(),
    };

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          attachments: [...(t.attachments || []), newAttachment],
        };
      }
      return t;
    });

    this.setItem(STORAGE_KEYS.TASKS, updated);
    audioEngine.playBellChime();
  }

  // --- XP & Gamification ---
  public awardXP(userId: string, xp: number, reason: PointsHistory['reason'], taskId?: string, taskTitle?: string) {
    const profiles = this.getProfiles();
    let userName = 'Worker';

    const updatedProfiles = profiles.map((p) => {
      if (p.id === userId) {
        userName = p.full_name;
        return {
          ...p,
          total_xp: p.total_xp + xp,
          current_streak: p.current_streak + 1,
        };
      }
      return p;
    });
    this.setItem(STORAGE_KEYS.PROFILES, updatedProfiles);

    const points = this.getPointsHistory();
    const newEntry: PointsHistory = {
      id: `pt-${Date.now()}`,
      company_id: this.getActiveCompanyId(),
      user_id: userId,
      user_name: userName,
      task_id: taskId,
      task_title: taskTitle,
      points_awarded: xp,
      reason,
      created_at: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.POINTS, [newEntry, ...points]);
  }

  public getPointsHistory(): PointsHistory[] {
    return this.getItem(STORAGE_KEYS.POINTS, INITIAL_POINTS_HISTORY);
  }

  // --- Real-time Messages ---
  public getMessages(): Message[] {
    return this.getItem(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
  }

  public getChannelMessages(channelName: string, companyId?: string): Message[] {
    const cid = companyId || this.getActiveCompanyId();
    return this.getMessages().filter((m) => m.channel_name === channelName && m.company_id === cid && !m.task_id);
  }

  public getTaskComments(taskId: string): Message[] {
    return this.getMessages().filter((m) => m.task_id === taskId);
  }

  public sendMessage(channelName: string, text: string, attachmentUrl?: string, taskId?: string) {
    const activeUser = this.getActiveUser();
    const activeCompany = this.getActiveCompany();
    const messages = this.getMessages();

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      company_id: activeCompany.id,
      sender_id: activeUser.id,
      sender_name: activeUser.full_name,
      sender_avatar: activeUser.avatar_url,
      channel_name: channelName,
      task_id: taskId,
      message: text,
      attachment_url: attachmentUrl,
      created_at: new Date().toISOString(),
    };

    this.setItem(STORAGE_KEYS.MESSAGES, [...messages, newMsg]);
    audioEngine.playChatChime();
  }

  // --- Admin Urgent Broadcast ---
  public getBroadcast(): AdminBroadcast | null {
    return this.getItem(STORAGE_KEYS.BROADCAST, INITIAL_BROADCAST);
  }

  public sendBroadcast(title: string, message: string, severity: 'urgent' | 'warning' | 'info' = 'urgent') {
    const activeUser = this.getActiveUser();
    const activeCompany = this.getActiveCompany();

    const broadcast: AdminBroadcast = {
      id: `bcast-${Date.now()}`,
      company_id: activeCompany.id,
      title,
      message,
      sender_name: `${activeUser.full_name} (${activeUser.role.replace('_', ' ').toUpperCase()})`,
      severity,
      timestamp: new Date().toISOString(),
      acknowledged_by: [],
    };

    this.setItem(STORAGE_KEYS.BROADCAST, broadcast);

    // Urgent Chime
    audioEngine.playUrgentAlert();

    // Also send automated email to all workers
    const workers = this.getCompanyProfiles();
    workers.forEach((w) => {
      this.logEmailNotification({
        recipient_email: w.email,
        recipient_name: w.full_name,
        subject: `🚨 [URGENT BROADCAST] ${title}`,
        type: 'admin_broadcast',
        status: 'delivered',
        html_preview: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:2px solid #ef4444;border-radius:12px;background:#fef2f2;">
            <h2 style="color:#b91c1c;margin:0 0 12px 0;">🚨 URGENT COMPANY BROADCAST</h2>
            <p><strong>From:</strong> ${broadcast.sender_name}</p>
            <p style="font-size:16px;line-height:1.5;color:#1e293b;">${message}</p>
          </div>
        `,
        payload: {
          from: 'Broadcast System <admin@domain.com>',
          to: w.email,
          subject: `🚨 [URGENT BROADCAST] ${title}`,
          tags: [{ name: 'type', value: 'admin_broadcast' }],
        },
      });
    });
  }

  public acknowledgeBroadcast(userId?: string) {
    const uid = userId || this.getActiveUserId();
    const current = this.getBroadcast();
    if (!current) return;

    if (!current.acknowledged_by.includes(uid)) {
      const updated = {
        ...current,
        acknowledged_by: [...current.acknowledged_by, uid],
      };
      this.setItem(STORAGE_KEYS.BROADCAST, updated);
    }
  }

  public clearBroadcast() {
    this.setItem(STORAGE_KEYS.BROADCAST, null);
  }

  // --- Automated Email Center (Resend) ---
  public getEmails(): EmailNotification[] {
    return this.getItem(STORAGE_KEYS.EMAILS, INITIAL_EMAILS);
  }

  public logEmailNotification(emailData: Omit<EmailNotification, 'id' | 'sent_at'>) {
    const emails = this.getEmails();
    const newEmail: EmailNotification = {
      ...emailData,
      id: `email-${Date.now()}`,
      sent_at: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.EMAILS, [newEmail, ...emails]);
  }
}

export const saasStore = SaaSStore.getInstance();
