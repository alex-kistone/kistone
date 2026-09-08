
-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create client_needs table
CREATE TABLE public.client_needs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  profile_types TEXT[] NOT NULL DEFAULT '{}',
  budget_tjm_min INTEGER,
  budget_tjm_max INTEGER,
  mission_location TEXT NOT NULL,
  remote_policy TEXT NOT NULL DEFAULT 'on-site',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_needs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own needs"
ON public.client_needs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Clients can create their own needs"
ON public.client_needs FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'client'));

CREATE POLICY "Clients can update their own needs"
ON public.client_needs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Clients can delete their own needs"
ON public.client_needs FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all needs"
ON public.client_needs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all needs"
ON public.client_needs FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all needs"
ON public.client_needs FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_client_needs_updated_at
BEFORE UPDATE ON public.client_needs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
