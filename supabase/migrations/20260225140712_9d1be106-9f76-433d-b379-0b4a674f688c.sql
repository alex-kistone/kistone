-- Table to track mission extensions/renewals
CREATE TABLE public.mission_extensions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  previous_end_date date,
  new_end_date date,
  previous_duration_text text,
  new_duration_text text,
  previous_recruiter_tjm integer,
  new_recruiter_tjm integer,
  previous_client_tjm integer,
  new_client_tjm integer,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.mission_extensions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage extensions
CREATE POLICY "Admins can manage all extensions"
  ON public.mission_extensions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Freelancers can view extensions on their missions
CREATE POLICY "Freelancers can view own mission extensions"
  ON public.mission_extensions
  FOR SELECT
  USING (mission_id IN (
    SELECT m.id FROM missions m
    WHERE m.recruiter_profile_id IN (
      SELECT rp.id FROM recruiter_profiles rp WHERE rp.user_id = auth.uid()
    )
  ));

-- Clients can view extensions on their needs' missions
CREATE POLICY "Clients can view extensions for their missions"
  ON public.mission_extensions
  FOR SELECT
  USING (mission_id IN (
    SELECT m.id FROM missions m
    WHERE m.need_id IN (
      SELECT cn.id FROM client_needs cn WHERE cn.user_id = auth.uid()
    )
  ));