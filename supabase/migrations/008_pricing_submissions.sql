-- Create pricing_submissions table to store pricing inquiries and quote requests
CREATE TABLE IF NOT EXISTS public.pricing_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  plan_name TEXT DEFAULT 'Enterprise',
  team_size TEXT DEFAULT '10-50 members',
  message TEXT,
  status TEXT DEFAULT 'new',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add basic security policy
ALTER TABLE public.pricing_submissions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role can manage pricing_submissions" ON public.pricing_submissions;
CREATE POLICY "Service role can manage pricing_submissions" ON public.pricing_submissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

