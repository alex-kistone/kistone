CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://eyfjdytnpqibeqfzpdvr.supabase.co/functions/v1/notify-new-message',
    body := jsonb_build_object('record', row_to_json(NEW)),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
END;
$$;