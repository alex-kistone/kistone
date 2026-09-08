CREATE POLICY "Admins can update suggestions"
ON public.profile_suggestions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));