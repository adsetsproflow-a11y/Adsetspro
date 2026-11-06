-- ============================================================================
-- SAAA SaaS Platform - Migration 005: Add Company Phone & Permanent Registration Archive
-- ============================================================================

-- Add phone and registrant snapshot columns to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS registrant_name TEXT,
  ADD COLUMN IF NOT EXISTS registrant_email TEXT,
  ADD COLUMN IF NOT EXISTS registrant_phone TEXT;

-- Create permanent archive table for all company registrations
CREATE TABLE IF NOT EXISTS public.company_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_slug TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comp_reg_created_at ON public.company_registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comp_reg_phone ON public.company_registrations (phone);

