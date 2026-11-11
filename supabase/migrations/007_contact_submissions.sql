-- Create contact_submissions table to store inquiries submitted from the /contact page
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add basic security policy
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role can manage contact_submissions" ON public.contact_submissions;
CREATE POLICY "Service role can manage contact_submissions" ON public.contact_submissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

