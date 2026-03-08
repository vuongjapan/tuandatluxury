
-- Create storage bucket for site assets (logo, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to read site assets
CREATE POLICY "Public can view site assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Allow admins to manage site assets
CREATE POLICY "Admins can manage site assets"
ON storage.objects FOR ALL
USING (
  bucket_id = 'site-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
