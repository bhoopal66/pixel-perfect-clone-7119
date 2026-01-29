-- Create storage bucket for case documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-documents', 'case-documents', false);

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Authenticated users can upload case documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'case-documents');

-- Allow authenticated users to view case documents
CREATE POLICY "Authenticated users can view case documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'case-documents');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update case documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'case-documents');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete case documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'case-documents');