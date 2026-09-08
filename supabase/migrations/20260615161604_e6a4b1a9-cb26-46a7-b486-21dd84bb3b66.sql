
CREATE OR REPLACE FUNCTION public.validate_studio_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.first_name IS NULL OR length(trim(NEW.first_name)) = 0 OR length(NEW.first_name) > 100 THEN
    RAISE EXCEPTION 'Invalid first_name';
  END IF;
  IF NEW.last_name IS NULL OR length(trim(NEW.last_name)) = 0 OR length(NEW.last_name) > 100 THEN
    RAISE EXCEPTION 'Invalid last_name';
  END IF;
  IF NEW.email IS NULL OR length(NEW.email) > 255 OR NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF NEW.phone IS NOT NULL AND (length(NEW.phone) > 30 OR NEW.phone !~ '^[0-9 +().-]{6,30}$') THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;
  IF NEW.company_name IS NOT NULL AND length(NEW.company_name) > 200 THEN
    RAISE EXCEPTION 'Invalid company_name';
  END IF;
  IF NEW.project_description IS NOT NULL AND length(NEW.project_description) > 5000 THEN
    RAISE EXCEPTION 'project_description too long';
  END IF;
  IF NEW.budget IS NOT NULL AND length(NEW.budget) > 100 THEN
    RAISE EXCEPTION 'Invalid budget';
  END IF;
  IF NEW.timeline IS NOT NULL AND length(NEW.timeline) > 100 THEN
    RAISE EXCEPTION 'Invalid timeline';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_studio_request_trigger ON public.studio_requests;
CREATE TRIGGER validate_studio_request_trigger
  BEFORE INSERT OR UPDATE ON public.studio_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_studio_request();
