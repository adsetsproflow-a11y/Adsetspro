-- Create demo_leads table to store inquiries and contact details from visitors requesting demo access
CREATE TABLE IF NOT EXISTS public.demo_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  unlocked_role TEXT,
  ip_address TEXT,
  synced_to_sheets BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add basic security policy
ALTER TABLE public.demo_leads ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role can manage demo_leads" ON public.demo_leads;
CREATE POLICY "Service role can manage demo_leads" ON public.demo_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

