-- Restrict Jarvi integration metadata to authenticated users
DROP POLICY IF EXISTS "Auth read field mappings" ON public.jarvi_field_mappings;
CREATE POLICY "Authenticated read field mappings"
ON public.jarvi_field_mappings
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Auth read mapping" ON public.persona_jarvi_mapping;
CREATE POLICY "Authenticated read mapping"
ON public.persona_jarvi_mapping
FOR SELECT
TO authenticated
USING (true);

-- jarvi_value_mappings has admin-only ALL but no public read policy; verify by leaving it.
-- Ensure no anon grants linger
REVOKE SELECT ON public.jarvi_field_mappings FROM anon;
REVOKE SELECT ON public.persona_jarvi_mapping FROM anon;