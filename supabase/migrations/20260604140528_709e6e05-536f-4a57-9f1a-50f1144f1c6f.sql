-- Remove the policy that exposes all admin user_ids to any authenticated user
DROP POLICY IF EXISTS "Anyone authenticated can read admin roles" ON public.user_roles;

-- Allow users to read their own roles (needed for client-side role checks)
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Secure RPC to fetch one admin user_id (used for chat target)
CREATE OR REPLACE FUNCTION public.get_admin_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_admin_user_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_id() TO authenticated;