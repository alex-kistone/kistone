
-- 1. Drop the overly broad policy that exposes contact info to all authenticated users
DROP POLICY "Authenticated users can view open needs" ON public.client_needs;

-- 2. Create a secure view that only exposes non-sensitive columns for pending needs
-- Using default security_definer so it bypasses RLS on the base table
CREATE VIEW public.client_needs_open AS
  SELECT 
    id,
    job_title,
    profile_types,
    budget_tjm_min,
    budget_tjm_max,
    mission_location,
    remote_policy,
    description,
    created_at
  FROM public.client_needs
  WHERE status = 'pending';

-- 3. Grant access to authenticated users via the view
GRANT SELECT ON public.client_needs_open TO authenticated;
