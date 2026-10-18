import { adminClient } from '@/lib/supabase/admin';

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

export interface CreateNotificationParams {
  userId: string;
  companyId?: string;
  type: NotificationType;
  title: string;
  body: string;
  payload?: Record<string, any>;
}

export async function createNotification({
  userId,
  companyId,
  type,
  title,
  body,
  payload = {},
}: CreateNotificationParams) {
  try {
    const { data, error } = await adminClient
      .from('notifications')
      .insert({
        user_id: userId,
        company_id: companyId || null,
        type,
        title,
        body,
        payload,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Failed to insert notification:', error);
      throw error;
    }

    return { success: true, notification: data };
  } catch (error: any) {
    console.error('createNotification helper error:', error);
    return { success: false, error: error.message || 'Notification creation failed' };
  }
}
