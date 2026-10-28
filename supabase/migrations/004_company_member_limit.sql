-- Add member_limit column to companies table with default of 5 members
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS member_limit INT NOT NULL DEFAULT 5;
