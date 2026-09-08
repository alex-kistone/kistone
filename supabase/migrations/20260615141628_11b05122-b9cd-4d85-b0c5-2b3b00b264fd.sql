
-- 1) Jarvi mappings: admin-only SELECT
DROP POLICY IF EXISTS "Authenticated read field mappings" ON public.jarvi_field_mappings;
CREATE POLICY "Admins read field mappings"
ON public.jarvi_field_mappings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated read value mappings" ON public.jarvi_value_mappings;
CREATE POLICY "Admins read value mappings"
ON public.jarvi_value_mappings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) profile-photos bucket: allow owners to UPDATE/DELETE their own photos
CREATE POLICY "Users can update own profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3) Move Stripe identifiers out of tenants table to admin-only table
CREATE TABLE IF NOT EXISTS public.tenant_billing (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Backfill existing data
INSERT INTO public.tenant_billing (tenant_id, stripe_customer_id, stripe_subscription_id)
SELECT id, stripe_customer_id, stripe_subscription_id
FROM public.tenants
WHERE stripe_customer_id IS NOT NULL OR stripe_subscription_id IS NOT NULL
ON CONFLICT (tenant_id) DO NOTHING;

ALTER TABLE public.tenants DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS stripe_subscription_id;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_billing TO authenticated;
GRANT ALL ON public.tenant_billing TO service_role;

ALTER TABLE public.tenant_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tenant billing"
ON public.tenant_billing
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_tenant_billing_updated_at
BEFORE UPDATE ON public.tenant_billing
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
