
-- Create client_profiles table
CREATE TABLE public.client_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT NOT NULL DEFAULT '',
  cities TEXT[] NOT NULL DEFAULT '{}',
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  job_title TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Clients can view their own profile
CREATE POLICY "Clients can view their own profile"
ON public.client_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Clients can insert their own profile
CREATE POLICY "Clients can insert their own profile"
ON public.client_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'client'::app_role));

-- Clients can update their own profile
CREATE POLICY "Clients can update their own profile"
ON public.client_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all client profiles
CREATE POLICY "Admins can view all client profiles"
ON public.client_profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all client profiles
CREATE POLICY "Admins can update all client profiles"
ON public.client_profiles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_client_profiles_updated_at
BEFORE UPDATE ON public.client_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
