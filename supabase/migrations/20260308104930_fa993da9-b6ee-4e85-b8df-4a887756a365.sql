-- Add document URL columns to recruiter_profiles
ALTER TABLE public.recruiter_profiles
ADD COLUMN IF NOT EXISTS urssaf_document_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS insurance_document_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rib_document_url text DEFAULT NULL;

-- Create a private storage bucket for admin documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-documents', 'admin-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Authenticated users can upload their own documents
CREATE POLICY "Users can upload own admin documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Users can view their own documents
CREATE POLICY "Users can view own admin documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'admin-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Users can update/replace their own documents
CREATE POLICY "Users can update own admin documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'admin-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Users can delete their own documents
CREATE POLICY "Users can delete own admin documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Admins can view all admin documents
CREATE POLICY "Admins can view all admin documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'admin-documents'
  AND public.has_role(auth.uid(), 'admin')
);