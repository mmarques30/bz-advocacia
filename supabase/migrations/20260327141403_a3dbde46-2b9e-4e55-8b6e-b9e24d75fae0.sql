-- Add formato column
ALTER TABLE public.treinamentos ADD COLUMN formato text DEFAULT 'link';

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('treinamentos', 'treinamentos', false);

-- Authenticated users can read files
CREATE POLICY "Authenticated users can read treinamentos files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'treinamentos');

-- Admins can upload files
CREATE POLICY "Admins can upload treinamentos files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'treinamentos' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can delete files
CREATE POLICY "Admins can delete treinamentos files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'treinamentos' AND public.has_role(auth.uid(), 'admin'::public.app_role));