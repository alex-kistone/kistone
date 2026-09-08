
-- Add new profile fields for recruiter enrichment
ALTER TABLE public.recruiter_profiles
  ADD COLUMN intro_text text,
  ADD COLUMN missions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN languages jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN has_linkedin_license boolean DEFAULT false;
