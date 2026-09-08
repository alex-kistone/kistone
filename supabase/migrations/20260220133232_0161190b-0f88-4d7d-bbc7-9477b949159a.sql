-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create trigger function to call edge function on new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url text;
  service_role_key text;
BEGIN
  edge_function_url := 'https://eyfjdytnpqibeqfzpdvr.supabase.co/functions/v1/notify-new-message';
  service_role_key := current_setting('app.settings.service_role_key', true);

  PERFORM extensions.http_post(
    url := edge_function_url,
    body := jsonb_build_object('record', row_to_json(NEW)),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();
