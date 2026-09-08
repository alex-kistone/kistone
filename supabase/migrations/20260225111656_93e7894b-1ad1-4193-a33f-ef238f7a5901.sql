-- Allow clients to update pipeline_status of suggestions linked to their needs (only to 'shortlisted')
CREATE POLICY "Clients can update their own suggestions to shortlisted"
ON public.profile_suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM client_needs
    WHERE client_needs.id = profile_suggestions.need_id
    AND client_needs.user_id = auth.uid()
  )
)
WITH CHECK (
  pipeline_status = 'shortlisted'
  AND EXISTS (
    SELECT 1 FROM client_needs
    WHERE client_needs.id = profile_suggestions.need_id
    AND client_needs.user_id = auth.uid()
  )
);