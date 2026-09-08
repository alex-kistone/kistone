
-- 1. Fix SECURITY DEFINER views by switching to security_invoker
ALTER VIEW public.freelance_missions SET (security_invoker = true);
ALTER VIEW public.client_missions SET (security_invoker = true);
ALTER VIEW public.client_needs_open SET (security_invoker = true);

-- 2. Restrict admin-documents bucket to users with a recruiter_profile (freelancers)
DROP POLICY IF EXISTS "Users can upload own admin documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own admin documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own admin documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own admin documents" ON storage.objects;

CREATE POLICY "Freelancers can upload own admin documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'admin-documents'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid())
);

CREATE POLICY "Freelancers can update own admin documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'admin-documents'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid())
);

CREATE POLICY "Freelancers can delete own admin documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'admin-documents'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid())
);

CREATE POLICY "Freelancers can view own admin documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'admin-documents'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (SELECT 1 FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid())
);

-- 3. Add scoped SELECT policies for missions (since views now use security_invoker)
CREATE POLICY "Clients can view missions for their needs"
ON public.missions FOR SELECT
USING (
  need_id IN (SELECT cn.id FROM public.client_needs cn WHERE cn.user_id = auth.uid())
);

CREATE POLICY "Freelancers can view their own missions"
ON public.missions FOR SELECT
USING (
  recruiter_profile_id IN (SELECT rp.id FROM public.recruiter_profiles rp WHERE rp.user_id = auth.uid())
);

-- 4. Prevent leaking recruiter_first_name to clients before the reveal stage
CREATE OR REPLACE FUNCTION public.enforce_recruiter_first_name_stage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pipeline_status NOT IN ('accepted','contract_pending','contract_signed','active','completed','mission_started') THEN
    NEW.recruiter_first_name := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_recruiter_first_name ON public.profile_suggestions;
CREATE TRIGGER trg_enforce_recruiter_first_name
BEFORE INSERT OR UPDATE ON public.profile_suggestions
FOR EACH ROW EXECUTE FUNCTION public.enforce_recruiter_first_name_stage();

-- Clean existing data: clear recruiter_first_name for suggestions still in early pipeline stages
UPDATE public.profile_suggestions
SET recruiter_first_name = NULL
WHERE recruiter_first_name IS NOT NULL
  AND pipeline_status NOT IN ('accepted','contract_pending','contract_signed','active','completed','mission_started');
