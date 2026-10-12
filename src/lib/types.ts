export type Role = 'super_admin' | 'company_admin' | 'team_lead' | 'worker';

export type Department = 'Development' | 'Design' | 'Content';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';

export interface Company {
  id: string;
  name: string;
  subdomain: string;
  plan: 'starter' | 'pro' | 'enterprise';
  max_users: number;
  storage_limit_mb: number;
  is_active: boolean;
  mrr: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  password_hash?: string;
  avatar_url: string;
  role: Role;
  department: Department;
  total_xp: number;
  current_streak: number;
  created_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  company_id: string;
  uploaded_by: string;
  original_name: string;
  webp_name: string;
  webp_url: string;
  original_url?: string;
  original_size_kb: number;
  webp_size_kb: number;
  savings_percentage: number;
  created_at: string;
}

export interface Task {
  id: string;
  company_id: string;
  department: Department;
  assigned_to: string; // user id
  created_by: string; // user id
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  reward_xp: number;
  due_date: string; // ISO string
  alarm_minutes_before: number;
  completed_at?: string;
  created_at: string;
  time_spent_seconds?: number;
  is_timer_running?: boolean;
  attachments?: TaskAttachment[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  comment: string;
  created_at: string;
}

export interface Message {
  id: string;
  company_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  channel_name: string; // '#general', '#designers', '#developers', '#content'
  task_id?: string;
  message: string;
  attachment_url?: string;
  is_broadcast?: boolean;
  created_at: string;
}

export interface AdminBroadcast {
  id: string;
  company_id: string;
  title: string;
  message: string;
  sender_name: string;
  severity: 'urgent' | 'warning' | 'info';
  timestamp: string;
  acknowledged_by: string[];
}

export interface PointsHistory {
  id: string;
  company_id: string;
  user_id: string;
  user_name: string;
  task_id?: string;
  task_title?: string;
  points_awarded: number;
  reason: 'task_completed' | 'early_bonus' | 'streak_bonus' | 'overdue_penalty';
  created_at: string;
}

export interface EmailNotification {
  id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  type: 'task_assigned' | 'deadline_warning' | 'admin_broadcast';
  status: 'sent' | 'delivered';
  sent_at: string;
  html_preview: string;
  payload: {
    from: string;
    to: string;
    subject: string;
    tags: { name: string; value: string }[];
  };
}
