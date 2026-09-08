
-- Table to store AI-generated profile suggestions per client need
CREATE TABLE public.profile_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  need_id UUID NOT NULL REFERENCES public.client_needs(id) ON DELETE CASCADE,
  recruiter_profile_id UUID NOT NULL,
  anonymous_label TEXT NOT NULL,
  match_score INTEGER NOT NULL DEFAULT 0,
  match_reasons TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_suggestions ENABLE ROW LEVEL SECURITY;

-- Clients can view suggestions for their own needs
CREATE POLICY "Clients can view their own suggestions"
ON public.profile_suggestions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.client_needs
    WHERE client_needs.id = profile_suggestions.need_id
    AND client_needs.user_id = auth.uid()
  )
);

-- Admins can manage all suggestions
CREATE POLICY "Admins can view all suggestions"
ON public.profile_suggestions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert suggestions"
ON public.profile_suggestions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete suggestions"
ON public.profile_suggestions FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Service role will insert via edge function, but also allow via RLS bypass
