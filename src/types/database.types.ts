export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CompanyStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type MemberRole = 'COMPANY_ADMIN' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';
export type MemberStatus = 'active' | 'inactive' | 'suspended';
export type DepartmentStatus = 'active' | 'archived';
export type DepartmentMemberStatus = 'active' | 'transferred' | 'removed';
export type InvitationRole = 'DEPARTMENT_HEAD' | 'EMPLOYEE';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled' | 'archived';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus =
  | 'assigned'
  | 'in_progress'
  | 'submitted_for_review'
  | 'revision_required'
  | 'approved'
  | 'blocked'
  | 'cancelled';
export type ChatRoomType = 'company' | 'department' | 'task' | 'direct';
export type AccountStatus = 'active' | 'suspended' | 'deactivated';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          avatar_url: string | null;
          phone: string | null;
          is_super_admin: boolean;
          account_status: AccountStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          avatar_url?: string | null;
          phone?: string | null;
          is_super_admin?: boolean;
          account_status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          avatar_url?: string | null;
          phone?: string | null;
          is_super_admin?: boolean;
          account_status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: CompanyStatus;
          created_by: string;
          approved_by: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          reject_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: CompanyStatus;
          created_by: string;
          approved_by?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          reject_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          status?: CompanyStatus;
          created_by?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          reject_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_memberships: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          role: MemberRole;
          status: MemberStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          role: MemberRole;
          status?: MemberStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          role?: MemberRole;
          status?: MemberStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          head_user_id: string | null;
          status: DepartmentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          head_user_id?: string | null;
          status?: DepartmentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          description?: string | null;
          head_user_id?: string | null;
          status?: DepartmentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      designations: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      department_memberships: {
        Row: {
          id: string;
          user_id: string;
          department_id: string;
          designation_id: string | null;
          reporting_to: string | null;
          status: DepartmentMemberStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          department_id: string;
          designation_id?: string | null;
          reporting_to?: string | null;
          status?: DepartmentMemberStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          department_id?: string;
          designation_id?: string | null;
          reporting_to?: string | null;
          status?: DepartmentMemberStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          company_id: string;
          department_id: string | null;
          email: string;
          full_name: string;
          role: InvitationRole;
          designation_id: string | null;
          reporting_to: string | null;
          token_hash: string;
          expires_at: string;
          status: InvitationStatus;
          invited_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          department_id?: string | null;
          email: string;
          full_name: string;
          role: InvitationRole;
          designation_id?: string | null;
          reporting_to?: string | null;
          token_hash: string;
          expires_at: string;
          status?: InvitationStatus;
          invited_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          department_id?: string | null;
          email?: string;
          full_name?: string;
          role?: InvitationRole;
          designation_id?: string | null;
          reporting_to?: string | null;
          token_hash?: string;
          expires_at?: string;
          status?: InvitationStatus;
          invited_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          company_id: string;
          department_id: string | null;
          name: string;
          description: string | null;
          status: ProjectStatus;
          priority: PriorityLevel;
          start_date: string | null;
          due_date: string | null;
          manager_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          department_id?: string | null;
          name: string;
          description?: string | null;
          status?: ProjectStatus;
          priority?: PriorityLevel;
          start_date?: string | null;
          due_date?: string | null;
          manager_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          department_id?: string | null;
          name?: string;
          description?: string | null;
          status?: ProjectStatus;
          priority?: PriorityLevel;
          start_date?: string | null;
          due_date?: string | null;
          manager_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          company_id: string;
          department_id: string | null;
          project_id: string | null;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: PriorityLevel;
          start_date: string | null;
          due_date: string | null;
          reviewer_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          department_id?: string | null;
          project_id?: string | null;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: PriorityLevel;
          start_date?: string | null;
          due_date?: string | null;
          reviewer_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          department_id?: string | null;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: PriorityLevel;
          start_date?: string | null;
          due_date?: string | null;
          reviewer_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_assignments: {
        Row: {
          id: string;
          task_id: string;
          employee_id: string;
          assigned_by: string;
          assigned_at: string;
          ended_at: string | null;
          is_current: boolean;
        };
        Insert: {
          id?: string;
          task_id: string;
          employee_id: string;
          assigned_by: string;
          assigned_at?: string;
          ended_at?: string | null;
          is_current?: boolean;
        };
        Update: {
          id?: string;
          task_id?: string;
          employee_id?: string;
          assigned_by?: string;
          assigned_at?: string;
          ended_at?: string | null;
          is_current?: boolean;
        };
        Relationships: [];
      };
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          content: string;
          is_review_comment: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          content: string;
          is_review_comment?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          content?: string;
          is_review_comment?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      task_attachments: {
        Row: {
          id: string;
          task_id: string;
          storage_path: string;
          file_name: string;
          file_size: number;
          file_type: string;
          uploaded_by: string;
          version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          storage_path: string;
          file_name: string;
          file_size: number;
          file_type: string;
          uploaded_by: string;
          version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          storage_path?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          uploaded_by?: string;
          version?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      task_activities: {
        Row: {
          id: string;
          task_id: string;
          actor_id: string;
          action: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          actor_id: string;
          action: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          actor_id?: string;
          action?: string;
          details?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          type: string;
          title: string;
          body: string;
          payload: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id?: string | null;
          type: string;
          title: string;
          body: string;
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string | null;
          type?: string;
          title?: string;
          body?: string;
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_rooms: {
        Row: {
          id: string;
          company_id: string;
          department_id: string | null;
          task_id: string | null;
          type: ChatRoomType;
          name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          department_id?: string | null;
          task_id?: string | null;
          type: ChatRoomType;
          name: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          department_id?: string | null;
          task_id?: string | null;
          type?: ChatRoomType;
          name?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_members: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          room_id: string;
          sender_id: string;
          content: string;
          edited_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          sender_id: string;
          content: string;
          edited_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          sender_id?: string;
          content?: string;
          edited_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_attachments: {
        Row: {
          id: string;
          message_id: string;
          storage_path: string;
          file_name: string;
          file_size: number;
          file_type: string;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          storage_path: string;
          file_name: string;
          file_size: number;
          file_type: string;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          storage_path?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          uploaded_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          company_id: string | null;
          action: string;
          target_id: string | null;
          target_type: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          company_id?: string | null;
          action: string;
          target_id?: string | null;
          target_type: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          company_id?: string | null;
          action?: string;
          target_id?: string | null;
          target_type?: string;
          details?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
