ALTER TABLE public.studio_requests
  ADD COLUMN IF NOT EXISTS project_type text,
  ADD COLUMN IF NOT EXISTS existing_project text,
  ADD COLUMN IF NOT EXISTS phone text;
-- 'theme' becomes legacy; allow null going forward
ALTER TABLE public.studio_requests ALTER COLUMN theme DROP NOT NULL;