
DROP POLICY "Clients can review submitted timesheets" ON public.timesheets;

CREATE POLICY "Clients can review submitted timesheets"
ON public.timesheets
FOR UPDATE
USING (
  (need_id IN (
    SELECT client_needs.id FROM client_needs
    WHERE client_needs.user_id = auth.uid()
  ))
  AND (status = 'submitted'::text)
)
WITH CHECK (
  (need_id IN (
    SELECT client_needs.id FROM client_needs
    WHERE client_needs.user_id = auth.uid()
  ))
  AND (status = ANY (ARRAY['client_approved'::text, 'client_rejected'::text]))
);
