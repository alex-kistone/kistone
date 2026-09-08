DROP POLICY IF EXISTS "Auth read value mappings" ON public.jarvi_value_mappings;
CREATE POLICY "Authenticated read value mappings"
ON public.jarvi_value_mappings
FOR SELECT
TO authenticated
USING (true);
REVOKE SELECT ON public.jarvi_value_mappings FROM anon;