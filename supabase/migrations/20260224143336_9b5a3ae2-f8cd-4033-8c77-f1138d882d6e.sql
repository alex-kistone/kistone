
-- Add admin-only fields to recruiter_profiles
ALTER TABLE public.recruiter_profiles
  ADD COLUMN admin_comments text,
  ADD COLUMN admin_rating integer DEFAULT 0,
  ADD COLUMN super_tam boolean DEFAULT false,
  ADD COLUMN tech_specialties text[] DEFAULT '{}'::text[];

-- Add check constraint for rating
ALTER TABLE public.recruiter_profiles
  ADD CONSTRAINT admin_rating_range CHECK (admin_rating >= 0 AND admin_rating <= 5);
