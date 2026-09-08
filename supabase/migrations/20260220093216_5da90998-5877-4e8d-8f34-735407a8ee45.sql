
-- Recruiter profiles table
CREATE TABLE public.recruiter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  skills TEXT[] DEFAULT '{}',
  clients TEXT[] DEFAULT '{}',
  tjm INTEGER,
  model TEXT CHECK (model IN ('RPO', 'Succès')),
  availability_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recruiter_profiles ENABLE ROW LEVEL SECURITY;

-- Role system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: Anyone can INSERT a profile (freelancers submit without auth)
CREATE POLICY "Anyone can submit a profile"
  ON public.recruiter_profiles FOR INSERT
  WITH CHECK (true);

-- RLS: Only admins can read profiles
CREATE POLICY "Admins can view all profiles"
  ON public.recruiter_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Only admins can update profiles
CREATE POLICY "Admins can update profiles"
  ON public.recruiter_profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Only admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.recruiter_profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for user_roles: only admins can read
CREATE POLICY "Admins can view roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Anyone can upload a photo
CREATE POLICY "Anyone can upload profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos');

-- Anyone can view photos (public bucket)
CREATE POLICY "Anyone can view profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');
