
-- Storage policy: restrict uploads to case-documents bucket
-- Only allow PDF, JPEG, PNG files up to 15MB
CREATE POLICY "Restrict file types and size on upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case-documents'
  AND (storage.extension(name) IN ('pdf', 'jpg', 'jpeg', 'png'))
  AND (octet_length(name) > 0)
);

-- Update existing upload policy if any to include MIME type check
-- Note: storage.objects RLS can check metadata but size is enforced at bucket level
UPDATE storage.buckets 
SET file_size_limit = 15728640,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png']
WHERE id = 'case-documents';
