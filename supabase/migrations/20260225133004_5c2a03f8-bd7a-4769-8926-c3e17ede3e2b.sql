
-- Function to set freelancer unavailable when mission becomes active
CREATE OR REPLACE FUNCTION public.set_freelancer_unavailable_on_mission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _end_date date;
  _next_monday date;
  _duration_months int;
BEGIN
  -- Only trigger when status changes to 'active'
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status <> 'active') THEN
    
    -- Determine end date
    _end_date := NEW.end_date;
    
    -- If no end_date, try to calculate from duration_text
    IF _end_date IS NULL AND NEW.duration_text IS NOT NULL THEN
      -- Extract number from duration_text (e.g. "3 mois", "6 mois", "12 mois")
      _duration_months := (regexp_match(NEW.duration_text, '(\d+)'))[1]::int;
      IF _duration_months IS NOT NULL THEN
        _end_date := NEW.start_date + (_duration_months * INTERVAL '1 month')::interval;
      END IF;
    END IF;
    
    -- Calculate next Monday after end date
    IF _end_date IS NOT NULL THEN
      -- next Monday: add days until day_of_week = 1 (Monday)
      _next_monday := _end_date + ((8 - EXTRACT(ISODOW FROM _end_date)::int) % 7)::int;
      -- If end_date is already Monday, go to next Monday
      IF _next_monday = _end_date THEN
        _next_monday := _end_date + 7;
      END IF;
    END IF;
    
    -- Update freelancer profile
    UPDATE public.recruiter_profiles
    SET available = false,
        availability_date = _next_monday
    WHERE id = NEW.recruiter_profile_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on missions table
CREATE TRIGGER set_freelancer_unavailable_trigger
AFTER INSERT OR UPDATE OF status ON public.missions
FOR EACH ROW
EXECUTE FUNCTION public.set_freelancer_unavailable_on_mission();
