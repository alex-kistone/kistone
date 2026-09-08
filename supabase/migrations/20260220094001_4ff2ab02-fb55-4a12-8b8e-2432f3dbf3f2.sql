
-- Add user_id to recruiter_profiles to link profiles to auth accounts
ALTER TABLE public.recruiter_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique constraint so one profile per user
ALTER TABLE public.recruiter_profiles ADD CONSTRAINT unique_user_profile UNIQUE (user_id);

-- Update RLS: authenticated users can insert their own profile
DROP POLICY "Anyone can submit a profile" ON public.recruiter_profiles;

CREATE POLICY "Authenticated users can create their own profile"
  ON public.recruiter_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can view and update their own profile
CREATE POLICY "Users can view their own profile"
  ON public.recruiter_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.recruiter_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
