-- 1) Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Đặc biệt',
  cover_image_url TEXT,
  conditions TEXT,
  expires_at TIMESTAMPTZ,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_offers_active_sort ON public.offers (is_active, sort_order);
CREATE INDEX idx_offers_featured ON public.offers (is_featured) WHERE is_featured = true;
CREATE INDEX idx_offers_slug ON public.offers (slug);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active offers"
ON public.offers FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage offers"
ON public.offers FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2) Create offers storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('offers', 'offers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view offers images"
ON storage.objects FOR SELECT
USING (bucket_id = 'offers');

CREATE POLICY "Admins can upload offers images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'offers' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update offers images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'offers' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete offers images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'offers' AND has_role(auth.uid(), 'admin'::app_role));