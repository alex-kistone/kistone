
-- Missions table: created when a profile is validated
CREATE TABLE public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Links
  suggestion_id uuid NOT NULL UNIQUE REFERENCES public.profile_suggestions(id) ON DELETE CASCADE,
  need_id uuid NOT NULL REFERENCES public.client_needs(id) ON DELETE CASCADE,
  recruiter_profile_id uuid NOT NULL REFERENCES public.recruiter_profiles(id) ON DELETE CASCADE,
  -- Mission details
  title text NOT NULL,
  company_name text NOT NULL,
  location text NOT NULL DEFAULT '',
  -- TJM: recruiter_tjm is the freelancer's rate, client_tjm is recruiter_tjm + margin
  recruiter_tjm integer NOT NULL DEFAULT 0,
  client_tjm integer NOT NULL DEFAULT 0,
  -- Duration & dates
  start_date date NOT NULL,
  end_date date,
  duration_text text, -- e.g. "3 mois renouvelable"
  -- Status: active, completed, cancelled
  status text NOT NULL DEFAULT 'active',
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage all missions"
ON public.missions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Freelancers can view their own missions (but only see recruiter_tjm)
CREATE POLICY "Freelancers can view own missions"
ON public.missions FOR SELECT
USING (recruiter_profile_id IN (
  SELECT id FROM public.recruiter_profiles WHERE user_id = auth.uid()
));

-- Clients can view missions for their needs (but only see client_tjm)
CREATE POLICY "Clients can view missions for their needs"
ON public.missions FOR SELECT
USING (need_id IN (
  SELECT id FROM public.client_needs WHERE user_id = auth.uid()
));

-- Update timesheets to reference missions instead of suggestions
-- Add mission_id to timesheets
ALTER TABLE public.timesheets ADD COLUMN mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE;

-- Trigger for updated_at
CREATE TRIGGER update_missions_updated_at
BEFORE UPDATE ON public.missions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
