ALTER TABLE public.support_messages DROP CONSTRAINT IF EXISTS support_messages_role_check;
ALTER TABLE public.support_messages ADD CONSTRAINT support_messages_role_check CHECK (role IN ('user','assistant','human'));

ALTER TABLE public.support_threads DROP CONSTRAINT IF EXISTS support_threads_status_check;
ALTER TABLE public.support_threads ADD CONSTRAINT support_threads_status_check CHECK (status IN ('open','escalated','resolved'));

CREATE OR REPLACE FUNCTION public.enforce_support_human_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'human' AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can post human support messages';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_support_human_role_trg ON public.support_messages;
CREATE TRIGGER enforce_support_human_role_trg
BEFORE INSERT OR UPDATE ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_support_human_role();

ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_threads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_threads;