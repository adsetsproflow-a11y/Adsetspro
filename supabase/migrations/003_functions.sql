-- ============================================================================
-- SAAA SaaS Platform - Migration 003: Database Functions & Triggers
-- Security Definer Functions for Roles, Super Admin, Slugs, and Profile Sync
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. is_super_admin(p_user_id UUID)
-- Determines if the specified user is a global platform Super Admin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (SELECT is_super_admin FROM public.profiles WHERE id = p_user_id AND account_status = 'active'),
        false
    );
$$;

-- ----------------------------------------------------------------------------
-- 2. get_user_company_role(p_user_id UUID, p_company_id UUID)
-- Returns the user's role in the given company ('COMPANY_ADMIN', 'DEPARTMENT_HEAD', 'EMPLOYEE')
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_company_role(p_user_id UUID, p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_role TEXT;
    v_is_super BOOLEAN;
BEGIN
    -- Super Admin has universal administrative authority
    SELECT is_super_admin INTO v_is_super FROM public.profiles WHERE id = p_user_id;
    IF v_is_super IS TRUE THEN
        RETURN 'SUPER_ADMIN';
    END IF;

    -- Query membership
    SELECT role INTO v_role
    FROM public.company_memberships
    WHERE user_id = p_user_id
      AND company_id = p_company_id
      AND status = 'active';

    RETURN v_role;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. generate_company_slug(company_name TEXT)
-- Generates a clean URL-friendly unique slug from a company name
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_company_slug(company_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_slug TEXT;
    v_temp_slug TEXT;
    v_counter INT := 1;
BEGIN
    -- Clean string: lowercase, replace spaces/special chars with hyphens
    v_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);

    IF v_slug IS NULL OR v_slug = '' THEN
        v_slug := 'company';
    END IF;

    v_temp_slug := v_slug;

    -- Ensure uniqueness in companies table
    WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = v_temp_slug) LOOP
        v_counter := v_counter + 1;
        v_temp_slug := v_slug || '-' || v_counter;
    END LOOP;

    RETURN v_temp_slug;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. on_auth_user_created()
-- Automatically creates a public.profiles row when a user signs up via Supabase Auth
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        avatar_url,
        phone,
        is_super_admin,
        account_status
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.phone,
        COALESCE((NEW.raw_user_meta_data->>'is_super_admin')::boolean, false),
        'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
