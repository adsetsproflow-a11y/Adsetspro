import { Database } from './database.types';

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';
export type CompanyStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type TaskStatus =
  | 'assigned'
  | 'in_progress'
  | 'submitted_for_review'
  | 'revision_required'
  | 'approved'
  | 'blocked'
  | 'cancelled';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type NotificationType =
  | 'task_assigned'
  | 'task_approved'
  | 'task_revision_requested'
  | 'task_submitted'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'company_approved'
  | 'company_rejected'
  | 'company_suspended'
  | 'deadline_warning'
  | 'overdue_task'
  | 'new_comment'
  | 'mention';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Company = Database['public']['Tables']['companies']['Row'];
export type CompanyMembership = Database['public']['Tables']['company_memberships']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
export type Designation = Database['public']['Tables']['designations']['Row'];
export type DepartmentMembership = Database['public']['Tables']['department_memberships']['Row'];
export type Invitation = Database['public']['Tables']['invitations']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskAssignment = Database['public']['Tables']['task_assignments']['Row'];
export type TaskComment = Database['public']['Tables']['task_comments']['Row'];
export type TaskAttachment = Database['public']['Tables']['task_attachments']['Row'];
export type TaskActivity = Database['public']['Tables']['task_activities']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
export type ChatMember = Database['public']['Tables']['chat_members']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatAttachment = Database['public']['Tables']['chat_attachments']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export interface UserSessionContext {
  profile: Profile;
  company?: Company | null;
  role?: UserRole | null;
  departmentId?: string | null;
}
