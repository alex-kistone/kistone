
-- Timesheets table: one per freelancer per mission per month
CREATE TABLE public.timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The profile_suggestion that was validated (links freelancer to need/client)
  suggestion_id uuid NOT NULL REFERENCES public.profile_suggestions(id) ON DELETE CASCADE,
  -- The recruiter (freelancer) profile
  recruiter_profile_id uuid NOT NULL REFERENCES public.recruiter_profiles(id) ON DELETE CASCADE,
  -- The client need
  need_id uuid NOT NULL REFERENCES public.client_needs(id) ON DELETE CASCADE,
  -- Month/year for the timesheet
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL CHECK (year >= 2020 AND year <= 2100),
  -- Total days calculated from timesheet_days
  total_days numeric(5,1) NOT NULL DEFAULT 0,
  -- Status flow: draft -> submitted -> client_approved / client_rejected -> admin_invoiced
  status text NOT NULL DEFAULT 'draft',
  -- Timestamps
  submitted_at timestamptz,
  client_reviewed_at timestamptz,
  client_reviewed_by uuid,
  admin_invoiced_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- One timesheet per freelancer per need per month
  UNIQUE(recruiter_profile_id, need_id, month, year)
);

-- Timesheet days: individual day entries
CREATE TABLE public.timesheet_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id uuid NOT NULL REFERENCES public.timesheets(id) ON DELETE CASCADE,
  day_date date NOT NULL,
  -- 0 = not worked, 0.5 = half day, 1 = full day
  value numeric(2,1) NOT NULL DEFAULT 0 CHECK (value IN (0, 0.5, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(timesheet_id, day_date)
);

-- Enable RLS
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_days ENABLE ROW LEVEL SECURITY;

-- RLS for timesheets

-- Freelancers can view their own timesheets
CREATE POLICY "Freelancers can view own timesheets"
ON public.timesheets FOR SELECT
USING (recruiter_profile_id IN (
  SELECT id FROM public.recruiter_profiles WHERE user_id = auth.uid()
));

-- Freelancers can create their own timesheets
CREATE POLICY "Freelancers can create own timesheets"
ON public.timesheets FOR INSERT
WITH CHECK (recruiter_profile_id IN (
  SELECT id FROM public.recruiter_profiles WHERE user_id = auth.uid()
));

-- Freelancers can update their own draft timesheets
CREATE POLICY "Freelancers can update own draft timesheets"
ON public.timesheets FOR UPDATE
USING (
  recruiter_profile_id IN (SELECT id FROM public.recruiter_profiles WHERE user_id = auth.uid())
  AND status IN ('draft', 'client_rejected')
);

-- Clients can view timesheets for their needs
CREATE POLICY "Clients can view timesheets for their needs"
ON public.timesheets FOR SELECT
USING (need_id IN (
  SELECT id FROM public.client_needs WHERE user_id = auth.uid()
));

-- Clients can update submitted timesheets (approve/reject)
CREATE POLICY "Clients can review submitted timesheets"
ON public.timesheets FOR UPDATE
USING (
  need_id IN (SELECT id FROM public.client_needs WHERE user_id = auth.uid())
  AND status = 'submitted'
);

-- Admins full access
CREATE POLICY "Admins can view all timesheets"
ON public.timesheets FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all timesheets"
ON public.timesheets FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete timesheets"
ON public.timesheets FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for timesheet_days

-- Freelancers can view days of their own timesheets
CREATE POLICY "Freelancers can view own timesheet days"
ON public.timesheet_days FOR SELECT
USING (timesheet_id IN (
  SELECT id FROM public.timesheets WHERE recruiter_profile_id IN (
    SELECT id FROM public.recruiter_profiles WHERE user_id = auth.uid()
  )
));

-- Freelancers can insert days into their own draft timesheets
CREATE POLICY "Freelancers can insert own timesheet days"
ON public.timesheet_days FOR INSERT
WITH CHECK (timesheet_id IN (
  SELECT id FROM public.timesheets WHERE recruiter_profile_id IN (
    SELECT id FROM public.recruiter_profiles WHERE user_id = auth.uid()
  ) AND status IN ('draft', 'client_rejected')
));

-- Freelancers can update days of their own draft timesheets
CREATE POLICY "Freelancers can update own timesheet days"
ON public.timesheet_days FOR UPDATE
USING (timesheet_id IN (
  SELECT id FROM public.timesheets WHERE recruiter_profile_id IN (
    SELECT id FROM public.recruiter_profiles WHERE user_id = auth.uid()
  ) AND status IN ('draft', 'client_rejected')
));

-- Freelancers can delete days of their own draft timesheets
CREATE POLICY "Freelancers can delete own timesheet days"
ON public.timesheet_days FOR DELETE
USING (timesheet_id IN (
  SELECT id FROM public.timesheets WHERE recruiter_profile_id IN (
    SELECT id FROM public.recruiter_profiles WHERE user_id = auth.uid()
  ) AND status IN ('draft', 'client_rejected')
));

-- Clients can view days of timesheets for their needs
CREATE POLICY "Clients can view timesheet days for their needs"
ON public.timesheet_days FOR SELECT
USING (timesheet_id IN (
  SELECT id FROM public.timesheets WHERE need_id IN (
    SELECT id FROM public.client_needs WHERE user_id = auth.uid()
  )
));

-- Admins full access on days
CREATE POLICY "Admins can view all timesheet days"
ON public.timesheet_days FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all timesheet days"
ON public.timesheet_days FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_timesheets_updated_at
BEFORE UPDATE ON public.timesheets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
