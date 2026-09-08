
-- Prevent duplicate emails in recruiter_profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_recruiter_profiles_email_unique ON public.recruiter_profiles (email);

-- Prevent duplicate emails in client_profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_profiles_email_unique ON public.client_profiles (email);

-- Allow clients to delete their own profile
CREATE POLICY "Clients can delete their own profile"
ON public.client_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own recruiter profile
CREATE POLICY "Users can delete their own recruiter profile"
ON public.recruiter_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own roles (for account deletion)
CREATE POLICY "Users can delete their own roles"
ON public.user_roles
FOR DELETE
USING (auth.uid() = user_id);

-- Create a function to delete a user's auth account (called after cleaning up data)
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = auth.uid();
  -- Delete from auth.users (this cascades)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
