
-- 1. Drop non-admin SELECT policies on missions
DROP POLICY IF EXISTS "Clients can view missions for their needs" ON public.missions;
DROP POLICY IF EXISTS "Freelancers can view own missions" ON public.missions;

-- 2. Role-scoped views with row filtering + column exclusion
CREATE OR REPLACE VIEW public.client_missions AS
SELECT
  m.id, m.title, m.company_name, m.location,
  m.client_tjm,
  m.start_date, m.end_date, m.duration_text, m.status,
  m.need_id, m.suggestion_id, m.recruiter_profile_id,
  m.tenant_id, m.created_at, m.updated_at
FROM public.missions m
WHERE m.need_id IN (
  SELECT cn.id FROM public.client_needs cn WHERE cn.user_id = auth.uid()
);

CREATE OR REPLACE VIEW public.freelance_missions AS
SELECT
  m.id, m.title, m.company_name, m.location,
  m.recruiter_tjm,
  m.start_date, m.end_date, m.duration_text, m.status,
  m.need_id, m.suggestion_id, m.recruiter_profile_id,
  m.tenant_id, m.created_at, m.updated_at
FROM public.missions m
WHERE m.recruiter_profile_id IN (
  SELECT rp.id FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid()
);

GRANT SELECT ON public.client_missions TO authenticated;
GRANT SELECT ON public.freelance_missions TO authenticated;

-- 3. Harden need_applications INSERT: require the need to actually exist
DROP POLICY IF EXISTS "Users can create applications" ON public.need_applications;

CREATE POLICY "Users can create applications"
ON public.need_applications
FOR INSERT
TO authenticated
WITH CHECK (
  recruiter_profile_id IN (
    SELECT id FROM public.recruiter_profiles WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.client_needs cn WHERE cn.id = need_id
  )
);
