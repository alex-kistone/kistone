-- Table for recruiter applications on open needs
CREATE TABLE public.need_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.client_needs(id) ON DELETE CASCADE,
  recruiter_profile_id uuid NOT NULL REFERENCES public.recruiter_profiles(id) ON DELETE CASCADE,
  motivation text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(need_id, recruiter_profile_id)
);

ALTER TABLE public.need_applications ENABLE ROW LEVEL SECURITY;

-- Recruiters can view their own applications
CREATE POLICY "Users can view own applications"
ON public.need_applications FOR SELECT
USING (recruiter_profile_id IN (
  SELECT id FROM public.recruiter_profiles WHERE user_id = auth.uid()
));

-- Recruiters can create applications
CREATE POLICY "Users can create applications"
ON public.need_applications FOR INSERT
WITH CHECK (recruiter_profile_id IN (
  SELECT id FROM public.recruiter_profiles WHERE user_id = auth.uid()
));

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.need_applications FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update applications
CREATE POLICY "Admins can update applications"
ON public.need_applications FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete applications
CREATE POLICY "Admins can delete applications"
ON public.need_applications FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users (recruiters) to view open needs (anonymized query in frontend)
CREATE POLICY "Authenticated users can view open needs"
ON public.client_needs FOR SELECT
USING (status = 'pending' AND auth.uid() IS NOT NULL);