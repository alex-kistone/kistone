
-- Add legal fields to recruiter_profiles
ALTER TABLE public.recruiter_profiles
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS siren text,
ADD COLUMN IF NOT EXISTS company_address text,
ADD COLUMN IF NOT EXISTS legal_form text,
ADD COLUMN IF NOT EXISTS tva_number text;

-- Add legal fields to client_profiles
ALTER TABLE public.client_profiles
ADD COLUMN IF NOT EXISTS siren text,
ADD COLUMN IF NOT EXISTS company_address text,
ADD COLUMN IF NOT EXISTS legal_form text,
ADD COLUMN IF NOT EXISTS representative_name text,
ADD COLUMN IF NOT EXISTS representative_title text;

-- Create contracts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Admins can manage contracts
CREATE POLICY "Admins can manage contracts"
ON storage.objects
FOR ALL
USING (bucket_id = 'contracts' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'contracts' AND has_role(auth.uid(), 'admin'::app_role));

-- RLS: Clients can view their contracts
CREATE POLICY "Clients can view their contracts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] IN (
    SELECT cn.id::text FROM client_needs cn WHERE cn.user_id = auth.uid()
  )
);

-- RLS: Freelancers can view their contracts
CREATE POLICY "Freelancers can view their contracts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] IN (
    SELECT m.need_id::text FROM missions m
    WHERE m.recruiter_profile_id IN (
      SELECT rp.id FROM recruiter_profiles rp WHERE rp.user_id = auth.uid()
    )
  )
);
