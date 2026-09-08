
ALTER TABLE public.recruiter_profiles
ADD COLUMN job_title text,
ADD COLUMN mobility text[] DEFAULT '{}'::text[],
ADD COLUMN available boolean DEFAULT true;
