
-- Drop the existing restrictive policy
DROP POLICY "Freelancers can update own draft timesheets" ON public.timesheets;

-- Recreate with correct logic: USING checks the OLD row, WITH CHECK allows the new status
CREATE POLICY "Freelancers can update own draft timesheets"
ON public.timesheets
FOR UPDATE
USING (
  (recruiter_profile_id IN (
    SELECT recruiter_profiles.id FROM recruiter_profiles
    WHERE recruiter_profiles.user_id = auth.uid()
  ))
  AND (status = ANY (ARRAY['draft'::text, 'client_rejected'::text]))
)
WITH CHECK (
  (recruiter_profile_id IN (
    SELECT recruiter_profiles.id FROM recruiter_profiles
    WHERE recruiter_profiles.user_id = auth.uid()
  ))
  AND (status = ANY (ARRAY['draft'::text, 'client_rejected'::text, 'submitted'::text]))
);
