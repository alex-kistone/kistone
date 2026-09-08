
-- 1) Re-scope policies from {public} to {authenticated} for sensitive tables
ALTER POLICY "Admins can delete all needs" ON public.client_needs TO authenticated;
ALTER POLICY "Admins can update all needs" ON public.client_needs TO authenticated;
ALTER POLICY "Admins can view all needs" ON public.client_needs TO authenticated;
ALTER POLICY "Clients can create their own needs" ON public.client_needs TO authenticated;
ALTER POLICY "Clients can delete their own needs" ON public.client_needs TO authenticated;
ALTER POLICY "Clients can update their own needs" ON public.client_needs TO authenticated;
ALTER POLICY "Clients can view their own needs" ON public.client_needs TO authenticated;

ALTER POLICY "Admins can update all client profiles" ON public.client_profiles TO authenticated;
ALTER POLICY "Admins can view all client profiles" ON public.client_profiles TO authenticated;
ALTER POLICY "Clients can delete their own profile" ON public.client_profiles TO authenticated;
ALTER POLICY "Clients can insert their own profile" ON public.client_profiles TO authenticated;
ALTER POLICY "Clients can update their own profile" ON public.client_profiles TO authenticated;
ALTER POLICY "Clients can view their own profile" ON public.client_profiles TO authenticated;

ALTER POLICY "Admins manage field mappings" ON public.jarvi_field_mappings TO authenticated;
ALTER POLICY "Admins manage value mappings" ON public.jarvi_value_mappings TO authenticated;

ALTER POLICY "Admins can manage all extensions" ON public.mission_extensions TO authenticated;
ALTER POLICY "Clients can view extensions for their missions" ON public.mission_extensions TO authenticated;
ALTER POLICY "Freelancers can view own mission extensions" ON public.mission_extensions TO authenticated;

ALTER POLICY "Admins can manage all missions" ON public.missions TO authenticated;
ALTER POLICY "Clients can view missions for their needs" ON public.missions TO authenticated;
ALTER POLICY "Freelancers can view their own missions" ON public.missions TO authenticated;

ALTER POLICY "Admins can delete applications" ON public.need_applications TO authenticated;
ALTER POLICY "Admins can update applications" ON public.need_applications TO authenticated;
ALTER POLICY "Admins can view all applications" ON public.need_applications TO authenticated;
ALTER POLICY "Users can view own applications" ON public.need_applications TO authenticated;

ALTER POLICY "Admins manage pending platform fields" ON public.pending_platform_fields TO authenticated;
ALTER POLICY "Admins manage mapping" ON public.persona_jarvi_mapping TO authenticated;

ALTER POLICY "Admins can delete suggestions" ON public.profile_suggestions TO authenticated;
ALTER POLICY "Admins can insert suggestions" ON public.profile_suggestions TO authenticated;
ALTER POLICY "Admins can update suggestions" ON public.profile_suggestions TO authenticated;
ALTER POLICY "Admins can view all suggestions" ON public.profile_suggestions TO authenticated;
ALTER POLICY "Clients can update their own suggestions to shortlisted" ON public.profile_suggestions TO authenticated;
ALTER POLICY "Clients can view their own suggestions" ON public.profile_suggestions TO authenticated;

ALTER POLICY "Admins can delete profiles" ON public.recruiter_profiles TO authenticated;
ALTER POLICY "Admins can update profiles" ON public.recruiter_profiles TO authenticated;
ALTER POLICY "Admins can view all profiles" ON public.recruiter_profiles TO authenticated;
ALTER POLICY "Users can delete their own recruiter profile" ON public.recruiter_profiles TO authenticated;

ALTER POLICY "Admins can manage specialties" ON public.specialties TO authenticated;

ALTER POLICY "Admins can delete studio requests" ON public.studio_requests TO authenticated;
ALTER POLICY "Admins can update studio requests" ON public.studio_requests TO authenticated;
ALTER POLICY "Admins can view all studio requests" ON public.studio_requests TO authenticated;

ALTER POLICY "Admins can manage all timesheet days" ON public.timesheet_days TO authenticated;
ALTER POLICY "Admins can view all timesheet days" ON public.timesheet_days TO authenticated;
ALTER POLICY "Clients can view timesheet days for their needs" ON public.timesheet_days TO authenticated;
ALTER POLICY "Freelancers can delete own timesheet days" ON public.timesheet_days TO authenticated;
ALTER POLICY "Freelancers can insert own timesheet days" ON public.timesheet_days TO authenticated;
ALTER POLICY "Freelancers can update own timesheet days" ON public.timesheet_days TO authenticated;
ALTER POLICY "Freelancers can view own timesheet days" ON public.timesheet_days TO authenticated;

ALTER POLICY "Admins can delete timesheets" ON public.timesheets TO authenticated;
ALTER POLICY "Admins can update all timesheets" ON public.timesheets TO authenticated;
ALTER POLICY "Admins can view all timesheets" ON public.timesheets TO authenticated;
ALTER POLICY "Clients can review submitted timesheets" ON public.timesheets TO authenticated;
ALTER POLICY "Clients can view timesheets for their needs" ON public.timesheets TO authenticated;
ALTER POLICY "Freelancers can create own timesheets" ON public.timesheets TO authenticated;
ALTER POLICY "Freelancers can update own draft timesheets" ON public.timesheets TO authenticated;
ALTER POLICY "Freelancers can view own timesheets" ON public.timesheets TO authenticated;

ALTER POLICY "Admins can view roles" ON public.user_roles TO authenticated;

ALTER POLICY "Admins can manage blog articles" ON public.blog_articles TO authenticated;

-- 2) Trigger to prevent freelancers from changing admin-controlled fields on timesheets
CREATE OR REPLACE FUNCTION public.enforce_timesheet_freelancer_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip enforcement for admins
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Block changes to admin-only fields by non-admins
  IF NEW.admin_invoiced_at IS DISTINCT FROM OLD.admin_invoiced_at
     OR NEW.client_reviewed_at IS DISTINCT FROM OLD.client_reviewed_at
     OR NEW.client_reviewed_by IS DISTINCT FROM OLD.client_reviewed_by
     OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
     OR NEW.recruiter_profile_id IS DISTINCT FROM OLD.recruiter_profile_id
     OR NEW.need_id IS DISTINCT FROM OLD.need_id
     OR NEW.mission_id IS DISTINCT FROM OLD.mission_id
     OR NEW.suggestion_id IS DISTINCT FROM OLD.suggestion_id
     OR NEW.month IS DISTINCT FROM OLD.month
     OR NEW.year IS DISTINCT FROM OLD.year THEN
    RAISE EXCEPTION 'Freelancers cannot modify protected timesheet fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_timesheet_freelancer_update_trg ON public.timesheets;
CREATE TRIGGER enforce_timesheet_freelancer_update_trg
BEFORE UPDATE ON public.timesheets
FOR EACH ROW
EXECUTE FUNCTION public.enforce_timesheet_freelancer_update();
