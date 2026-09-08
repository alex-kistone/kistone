CREATE POLICY "Anyone authenticated can read admin roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (role = 'admin');