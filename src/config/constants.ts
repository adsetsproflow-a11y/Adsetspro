export const COMPANY_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
} as const;

export const TASK_STATUSES = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  SUBMITTED_FOR_REVIEW: 'submitted_for_review',
  REVISION_REQUIRED: 'revision_required',
  APPROVED: 'approved',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
} as const;

export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const INVITATION_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const;

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_APPROVED: 'task_approved',
  TASK_REVISION_REQUESTED: 'task_revision_requested',
  TASK_SUBMITTED: 'task_submitted',
  INVITATION_SENT: 'invitation_sent',
  INVITATION_ACCEPTED: 'invitation_accepted',
  COMPANY_APPROVED: 'company_approved',
  COMPANY_REJECTED: 'company_rejected',
  COMPANY_SUSPENDED: 'company_suspended',
  DEADLINE_WARNING: 'deadline_warning',
  OVERDUE_TASK: 'overdue_task',
  NEW_COMMENT: 'new_comment',
  MENTION: 'mention',
} as const;

export const CHAT_ROOM_TYPES = {
  COMPANY: 'company',
  DEPARTMENT: 'department',
  TASK: 'task',
  DIRECT: 'direct',
} as const;

export const STORAGE_BUCKETS = {
  TASK_ATTACHMENTS: 'task-attachments',
  CHAT_ATTACHMENTS: 'chat-attachments',
  PROFILE_AVATARS: 'profile-avatars',
} as const;

export const APP_CONFIG = {
  NAME: 'Adsetspro Platform',
  DESCRIPTION: 'Multi-Tenant Enterprise Workflow & Project Management Suite',
  DEFAULT_PAGE_SIZE: 20,
  MAX_FILE_SIZE_MB: 50,
  INVITATION_EXPIRY_DAYS: 7,
  SIGNED_URL_EXPIRY_SECONDS: 60,
} as const;
