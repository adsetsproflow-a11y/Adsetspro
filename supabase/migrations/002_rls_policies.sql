-- ============================================================================
-- SAAA SaaS Platform - Migration 002: Row Level Security (RLS) Policies
-- Enforce Strict Multi-Tenant Data Isolation and Role-Based Access Controls
-- Idempotent: Safely drops and re-creates all policies
-- ============================================================================

-- Enable RLS on all 19 application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
    id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.company_memberships m1
        JOIN public.company_memberships m2 ON m1.company_id = m2.company_id
        WHERE m1.user_id = auth.uid() AND m2.user_id = public.profiles.id
    )
);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
    id = auth.uid() OR public.is_super_admin(auth.uid())
);

-- ----------------------------------------------------------------------------
-- 2. COMPANIES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
CREATE POLICY "companies_select_policy" ON public.companies
FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.company_memberships
        WHERE company_memberships.company_id = public.companies.id
          AND company_memberships.user_id = auth.uid()
          AND company_memberships.status = 'active'
    )
);

DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
CREATE POLICY "companies_update_policy" ON public.companies
FOR UPDATE USING (
    public.is_super_admin(auth.uid())
    OR (
        public.get_user_company_role(auth.uid(), public.companies.id) = 'COMPANY_ADMIN'
        AND status = 'approved'
    )
);

DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
CREATE POLICY "companies_insert_policy" ON public.companies
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. COMPANY MEMBERSHIPS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "company_memberships_select_policy" ON public.company_memberships;
CREATE POLICY "company_memberships_select_policy" ON public.company_memberships
FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR public.get_user_company_role(auth.uid(), company_id) IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD')
);

DROP POLICY IF EXISTS "company_memberships_all_policy" ON public.company_memberships;
CREATE POLICY "company_memberships_all_policy" ON public.company_memberships
FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR public.get_user_company_role(auth.uid(), company_id) = 'COMPANY_ADMIN'
);

-- ----------------------------------------------------------------------------
-- 4. DEPARTMENTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "departments_select_policy" ON public.departments;
CREATE POLICY "departments_select_policy" ON public.departments
FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.company_memberships
        WHERE company_memberships.company_id = public.departments.company_id
          AND company_memberships.user_id = auth.uid()
          AND company_memberships.status = 'active'
    )
);

DROP POLICY IF EXISTS "departments_modify_policy" ON public.departments;
CREATE POLICY "departments_modify_policy" ON public.departments
FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR public.get_user_company_role(auth.uid(), company_id) = 'COMPANY_ADMIN'
);

-- ----------------------------------------------------------------------------
-- 5. DESIGNATIONS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "designations_select_policy" ON public.designations;
CREATE POLICY "designations_select_policy" ON public.designations
FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.company_memberships
        WHERE company_memberships.company_id = public.designations.company_id
          AND company_memberships.user_id = auth.uid()
          AND company_memberships.status = 'active'
    )
);

DROP POLICY IF EXISTS "designations_modify_policy" ON public.designations;
CREATE POLICY "designations_modify_policy" ON public.designations
FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR public.get_user_company_role(auth.uid(), company_id) = 'COMPANY_ADMIN'
);

-- ----------------------------------------------------------------------------
-- 6. DEPARTMENT MEMBERSHIPS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "dept_memberships_select_policy" ON public.department_memberships;
CREATE POLICY "dept_memberships_select_policy" ON public.department_memberships
FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.departments d
        WHERE d.id = public.department_memberships.department_id
          AND public.get_user_company_role(auth.uid(), d.company_id) IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD')
    )
);

DROP POLICY IF EXISTS "dept_memberships_modify_policy" ON public.department_memberships;
CREATE POLICY "dept_memberships_modify_policy" ON public.department_memberships
FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.departments d
        WHERE d.id = public.department_memberships.department_id
          AND public.get_user_company_role(auth.uid(), d.company_id) = 'COMPANY_ADMIN'
    )
);

-- ----------------------------------------------------------------------------
-- 7. INVITATIONS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "invitations_all_policy" ON public.invitations;
CREATE POLICY "invitations_all_policy" ON public.invitations
FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR public.get_user_company_role(auth.uid(), company_id) = 'COMPANY_ADMIN'
);

-- ----------------------------------------------------------------------------
-- 8. PROJECTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
CREATE POLICY "projects_select_policy" ON public.projects
FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.company_memberships
        WHERE company_memberships.company_id = public.projects.company_id
          AND company_memberships.user_id = auth.uid()
          AND company_memberships.status = 'active'
    )
);

DROP POLICY IF EXISTS "projects_modify_policy" ON public.projects;
CREATE POLICY "projects_modify_policy" ON public.projects
FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR public.get_user_company_role(auth.uid(), company_id) IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD')
);

-- ----------------------------------------------------------------------------
-- 9. TASKS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
CREATE POLICY "tasks_select_policy" ON public.tasks
FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR public.get_user_company_role(auth.uid(), company_id) IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD')
    OR reviewer_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.task_assignments
        WHERE task_assignments.task_id = public.tasks.id
          AND task_assignments.employee_id = auth.uid()
          AND task_assignments.is_current = true
    )
);

DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
CREATE POLICY "tasks_insert_policy" ON public.tasks
FOR INSERT WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.get_user_company_role(auth.uid(), company_id) IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD')
);

DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;
CREATE POLICY "tasks_update_policy" ON public.tasks
FOR UPDATE USING (
    public.is_super_admin(auth.uid())
    OR public.get_user_company_role(auth.uid(), company_id) IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD')
    OR reviewer_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.task_assignments
        WHERE task_assignments.task_id = public.tasks.id
          AND task_assignments.employee_id = auth.uid()
          AND task_assignments.is_current = true
    )
);

-- ----------------------------------------------------------------------------
-- 10. TASK ASSIGNMENTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "task_assignments_select_policy" ON public.task_assignments;
CREATE POLICY "task_assignments_select_policy" ON public.task_assignments
FOR SELECT USING (
    employee_id = auth.uid()
    OR assigned_by = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = public.task_assignments.task_id
          AND public.get_user_company_role(auth.uid(), t.company_id) IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD')
    )
);

DROP POLICY IF EXISTS "task_assignments_modify_policy" ON public.task_assignments;
CREATE POLICY "task_assignments_modify_policy" ON public.task_assignments
FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = public.task_assignments.task_id
          AND public.get_user_company_role(auth.uid(), t.company_id) IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD')
    )
);

-- ----------------------------------------------------------------------------
-- 11. TASK COMMENTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "task_comments_select_policy" ON public.task_comments;
CREATE POLICY "task_comments_select_policy" ON public.task_comments
FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = public.task_comments.task_id
          AND (
              public.get_user_company_role(auth.uid(), t.company_id) IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD')
              OR t.reviewer_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.task_assignments ta
                  WHERE ta.task_id = t.id AND ta.employee_id = auth.uid() AND ta.is_current = true
              )
          )
    )
);

DROP POLICY IF EXISTS "task_comments_insert_policy" ON public.task_comments;
CREATE POLICY "task_comments_insert_policy" ON public.task_comments
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- ----------------------------------------------------------------------------
-- 12. TASK ATTACHMENTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "task_attachments_select_policy" ON public.task_attachments;
CREATE POLICY "task_attachments_select_policy" ON public.task_attachments
FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = public.task_attachments.task_id
          AND (
              public.get_user_company_role(auth.uid(), t.company_id) IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD')
              OR t.reviewer_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.task_assignments ta
                  WHERE ta.task_id = t.id AND ta.employee_id = auth.uid() AND ta.is_current = true
              )
          )
    )
);

DROP POLICY IF EXISTS "task_attachments_modify_policy" ON public.task_attachments;
CREATE POLICY "task_attachments_modify_policy" ON public.task_attachments
FOR ALL USING (
    uploaded_by = auth.uid()
    OR public.is_super_admin(auth.uid())
);

-- ----------------------------------------------------------------------------
-- 13. TASK ACTIVITIES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "task_activities_select_policy" ON public.task_activities;
CREATE POLICY "task_activities_select_policy" ON public.task_activities
FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = public.task_activities.task_id
          AND (
              public.get_user_company_role(auth.uid(), t.company_id) IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD')
              OR t.reviewer_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.task_assignments ta
                  WHERE ta.task_id = t.id AND ta.employee_id = auth.uid() AND ta.is_current = true
              )
          )
    )
);

DROP POLICY IF EXISTS "task_activities_insert_policy" ON public.task_activities;
CREATE POLICY "task_activities_insert_policy" ON public.task_activities
FOR INSERT WITH CHECK (
    actor_id = auth.uid() OR public.is_super_admin(auth.uid())
);

-- ----------------------------------------------------------------------------
-- 14. NOTIFICATIONS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "notifications_own_policy" ON public.notifications;
CREATE POLICY "notifications_own_policy" ON public.notifications
FOR ALL USING (
    user_id = auth.uid()
);

-- ----------------------------------------------------------------------------
-- 15. CHAT ROOMS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "chat_rooms_select_policy" ON public.chat_rooms;
CREATE POLICY "chat_rooms_select_policy" ON public.chat_rooms
FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.company_memberships
        WHERE company_memberships.company_id = public.chat_rooms.company_id
          AND company_memberships.user_id = auth.uid()
          AND company_memberships.status = 'active'
    )
);

DROP POLICY IF EXISTS "chat_rooms_insert_policy" ON public.chat_rooms;
CREATE POLICY "chat_rooms_insert_policy" ON public.chat_rooms
FOR INSERT WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.get_user_company_role(auth.uid(), company_id) IN ('COMPANY_ADMIN', 'DEPARTMENT_HEAD')
);

-- ----------------------------------------------------------------------------
-- 16. CHAT MEMBERS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "chat_members_policy" ON public.chat_members;
CREATE POLICY "chat_members_policy" ON public.chat_members
FOR ALL USING (
    user_id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.chat_rooms r
        WHERE r.id = public.chat_members.room_id
          AND public.get_user_company_role(auth.uid(), r.company_id) = 'COMPANY_ADMIN'
    )
);

-- ----------------------------------------------------------------------------
-- 17. CHAT MESSAGES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "chat_messages_select_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_select_policy" ON public.chat_messages
FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.chat_members
        WHERE chat_members.room_id = public.chat_messages.room_id
          AND chat_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.chat_rooms r
        WHERE r.id = public.chat_messages.room_id
          AND r.type = 'company'
          AND EXISTS (
              SELECT 1 FROM public.company_memberships cm
              WHERE cm.company_id = r.company_id AND cm.user_id = auth.uid() AND cm.status = 'active'
          )
    )
);

DROP POLICY IF EXISTS "chat_messages_insert_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_policy" ON public.chat_messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (
        EXISTS (
            SELECT 1 FROM public.chat_members
            WHERE chat_members.room_id = public.chat_messages.room_id
              AND chat_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.chat_rooms r
            WHERE r.id = public.chat_messages.room_id
              AND r.type = 'company'
              AND EXISTS (
                  SELECT 1 FROM public.company_memberships cm
                  WHERE cm.company_id = r.company_id AND cm.user_id = auth.uid() AND cm.status = 'active'
              )
        )
    )
);

-- ----------------------------------------------------------------------------
-- 18. CHAT ATTACHMENTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "chat_attachments_policy" ON public.chat_attachments;
CREATE POLICY "chat_attachments_policy" ON public.chat_attachments
FOR ALL USING (
    uploaded_by = auth.uid()
    OR public.is_super_admin(auth.uid())
);

-- ----------------------------------------------------------------------------
-- 19. AUDIT LOGS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR (
        company_id IS NOT NULL
        AND public.get_user_company_role(auth.uid(), company_id) = 'COMPANY_ADMIN'
    )
);

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);
