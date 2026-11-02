-- Create demo_leads table to store inquiries and contact details from visitors requesting demo access
CREATE TABLE IF NOT EXISTS public.demo_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  unlocked_role TEXT,
  ip_address TEXT,
  status TEXT DEFAULT 'new',
  synced_to_sheets BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure status column exists if table was previously created
ALTER TABLE public.demo_leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Enable RLS and add basic security policy
ALTER TABLE public.demo_leads ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role can manage demo_leads" ON public.demo_leads;
CREATE POLICY "Service role can manage demo_leads" ON public.demo_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

