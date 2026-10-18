-- ============================================================================
-- SAAA SaaS Platform - Development Seed Script
-- Creates Super Admin, 2 Test Companies, Departments, Memberships, & Sample Tasks
-- ============================================================================

-- Variables for IDs
DO $$
DECLARE
    -- Super Admin
    v_super_admin_id UUID := '00000000-0000-0000-0000-000000000001';

    -- Company 1: Acme Global
    v_acme_id UUID := '11111111-1111-1111-1111-111111111111';
    v_acme_admin_id UUID := '11111111-1111-1111-1111-000000000001';
    v_acme_head_id UUID := '11111111-1111-1111-1111-000000000002';
    v_acme_emp_id UUID := '11111111-1111-1111-1111-000000000003';
    v_acme_dept_eng UUID := '11111111-2222-1111-1111-000000000001';
    v_acme_dept_des UUID := '11111111-2222-1111-1111-000000000002';
    v_acme_desig_eng UUID := '11111111-3333-1111-1111-000000000001';
    v_acme_proj_core UUID := '11111111-4444-1111-1111-000000000001';
    v_acme_task_1 UUID := '11111111-5555-1111-1111-000000000001';

    -- Company 2: Nexus Dynamics
    v_nexus_id UUID := '22222222-2222-2222-2222-222222222222';
    v_nexus_admin_id UUID := '22222222-2222-2222-2222-000000000001';
    v_nexus_head_id UUID := '22222222-2222-2222-2222-000000000002';
    v_nexus_dept_mkt UUID := '22222222-3333-2222-2222-000000000001';
BEGIN
    -- ------------------------------------------------------------------------
    -- 1. Create or ensure profiles
    -- ------------------------------------------------------------------------
    INSERT INTO public.profiles (id, full_name, email, is_super_admin, account_status)
    VALUES
        (v_super_admin_id, 'Platform Super Admin', 'superadmin@saaa-platform.com', true, 'active'),
        (v_acme_admin_id, 'Alice Vance (Acme Admin)', 'alice@acmeglobal.com', false, 'active'),
        (v_acme_head_id, 'Bob Miller (Lead Architect)', 'bob@acmeglobal.com', false, 'active'),
        (v_acme_emp_id, 'Charlie Day (Frontend Dev)', 'charlie@acmeglobal.com', false, 'active'),
        (v_nexus_admin_id, 'David Chen (Nexus CEO)', 'david@nexusdynamics.io', false, 'active'),
        (v_nexus_head_id, 'Elena Rostova (Marketing Head)', 'elena@nexusdynamics.io', false, 'active')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        is_super_admin = EXCLUDED.is_super_admin;

    -- ------------------------------------------------------------------------
    -- 2. Create Companies
    -- ------------------------------------------------------------------------
    INSERT INTO public.companies (id, name, slug, status, created_by, approved_by, approved_at)
    VALUES
        (v_acme_id, 'Acme Global Corp', 'acme-global', 'approved', v_acme_admin_id, v_super_admin_id, NOW()),
        (v_nexus_id, 'Nexus Dynamics Inc', 'nexus-dynamics', 'approved', v_nexus_admin_id, v_super_admin_id, NOW())
    ON CONFLICT (id) DO UPDATE SET
        status = 'approved';

    -- ------------------------------------------------------------------------
    -- 3. Company Memberships
    -- ------------------------------------------------------------------------
    INSERT INTO public.company_memberships (user_id, company_id, role, status)
    VALUES
        (v_acme_admin_id, v_acme_id, 'COMPANY_ADMIN', 'active'),
        (v_acme_head_id, v_acme_id, 'DEPARTMENT_HEAD', 'active'),
        (v_acme_emp_id, v_acme_id, 'EMPLOYEE', 'active'),
        (v_nexus_admin_id, v_nexus_id, 'COMPANY_ADMIN', 'active'),
        (v_nexus_head_id, v_nexus_id, 'DEPARTMENT_HEAD', 'active')
    ON CONFLICT (user_id, company_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = EXCLUDED.status;

    -- ------------------------------------------------------------------------
    -- 4. Departments
    -- ------------------------------------------------------------------------
    INSERT INTO public.departments (id, company_id, name, description, head_user_id, status)
    VALUES
        (v_acme_dept_eng, v_acme_id, 'Engineering', 'Core software development & architecture', v_acme_head_id, 'active'),
        (v_acme_dept_des, v_acme_id, 'Product & Design', 'UI/UX research and asset production', NULL, 'active'),
        (v_nexus_dept_mkt, v_nexus_id, 'Growth & Marketing', 'Brand campaigns and enterprise acquisition', v_nexus_head_id, 'active')
    ON CONFLICT (company_id, name) DO NOTHING;

    -- ------------------------------------------------------------------------
    -- 5. Designations
    -- ------------------------------------------------------------------------
    INSERT INTO public.designations (id, company_id, name)
    VALUES
        (v_acme_desig_eng, v_acme_id, 'Senior Software Engineer')
    ON CONFLICT (company_id, name) DO NOTHING;

    -- ------------------------------------------------------------------------
    -- 6. Department Memberships
    -- ------------------------------------------------------------------------
    INSERT INTO public.department_memberships (user_id, department_id, designation_id, reporting_to, status)
    VALUES
        (v_acme_head_id, v_acme_dept_eng, v_acme_desig_eng, v_acme_admin_id, 'active'),
        (v_acme_emp_id, v_acme_dept_eng, v_acme_desig_eng, v_acme_head_id, 'active')
    ON CONFLICT (user_id, department_id) DO NOTHING;

    -- ------------------------------------------------------------------------
    -- 7. Sample Projects
    -- ------------------------------------------------------------------------
    INSERT INTO public.projects (id, company_id, department_id, name, description, status, priority, manager_id, created_by)
    VALUES
        (v_acme_proj_core, v_acme_id, v_acme_dept_eng, 'Cloud Infrastructure Migration', 'Migrate workloads to high-availability architecture', 'active', 'high', v_acme_head_id, v_acme_admin_id)
    ON CONFLICT (id) DO NOTHING;

    -- ------------------------------------------------------------------------
    -- 8. Sample Tasks & Assignments
    -- ------------------------------------------------------------------------
    INSERT INTO public.tasks (id, company_id, department_id, project_id, title, description, status, priority, due_date, reviewer_id, created_by)
    VALUES
        (v_acme_task_1, v_acme_id, v_acme_dept_eng, v_acme_proj_core, 'Setup Supabase Row Level Security Audit', 'Review RLS policies and indexes on production schema', 'in_progress', 'urgent', NOW() + INTERVAL '3 days', v_acme_head_id, v_acme_admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.task_assignments (task_id, employee_id, assigned_by, is_current)
    VALUES
        (v_acme_task_1, v_acme_emp_id, v_acme_admin_id, true)
    ON CONFLICT DO NOTHING;

    -- ------------------------------------------------------------------------
    -- 9. Chat Rooms (General Channel)
    -- ------------------------------------------------------------------------
    INSERT INTO public.chat_rooms (company_id, type, name, created_by)
    VALUES
        (v_acme_id, 'company', 'general', v_acme_admin_id),
        (v_nexus_id, 'company', 'general', v_nexus_admin_id)
    ON CONFLICT DO NOTHING;

END $$;
