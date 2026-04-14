-- =============================================
-- Phase 1.3 — Require authentication for uploads to the
-- "contact-documents" bucket. The contact form lives inside the
-- authenticated area (pages/Index.tsx → ProtectedRoute), so this
-- tightening does not break the existing user flow.
--
-- "No public reads" policy stays intact (signed URLs or server-side
-- reads via service role remain the only way to download).
-- =============================================

DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;

CREATE POLICY "Authenticated users can upload contact documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contact-documents' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to read their own uploads. If a stricter
-- rule is needed later (e.g. only admins), add a more specific policy.
CREATE POLICY "Authenticated users can read contact documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'contact-documents');
