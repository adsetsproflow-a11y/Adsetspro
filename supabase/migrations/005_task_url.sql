-- Add task_url column to tasks table for reference links (Figma, Google Docs, GitHub, Canva, etc.)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_url TEXT;

