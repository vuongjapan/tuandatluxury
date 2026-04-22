-- 1. Create dishes table
CREATE TABLE public.dishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_vi TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  description_vi TEXT,
  description_en TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'main',
  price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'negotiable')),
  price INTEGER NOT NULL DEFAULT 0,
  price_variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active dishes"
ON public.dishes FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage dishes"
ON public.dishes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Updated_at trigger
CREATE TRIGGER update_dishes_updated_at
BEFORE UPDATE ON public.dishes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Migrate data from menu_items to dishes (keep same id for booking continuity)
INSERT INTO public.dishes (
  id, name_vi, name_en, description_vi, description_en, image_url,
  category, price_type, price, is_active, is_popular, sort_order, created_at, updated_at
)
SELECT
  id, name_vi, name_en, description_vi, description_en, image_url,
  category, price_type, price_vnd, is_active, is_popular, sort_order, created_at, updated_at
FROM public.menu_items
ON CONFLICT (id) DO NOTHING;

-- 5. Aggregate menu_item_prices into price_variants jsonb on dishes
UPDATE public.dishes d
SET price_variants = sub.variants
FROM (
  SELECT
    menu_item_id,
    jsonb_agg(
      jsonb_build_object(
        'label', label_vi,
        'label_en', label_en,
        'price', price_vnd
      ) ORDER BY sort_order
    ) AS variants
  FROM public.menu_item_prices
  WHERE is_active = true
  GROUP BY menu_item_id
) sub
WHERE d.id = sub.menu_item_id;

-- 6. Indexes
CREATE INDEX idx_dishes_active ON public.dishes(is_active);
CREATE INDEX idx_dishes_category ON public.dishes(category);
CREATE INDEX idx_dishes_sort ON public.dishes(sort_order);

-- 7. Storage bucket for dish images
INSERT INTO storage.buckets (id, name, public)
VALUES ('dish-images', 'dish-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view dish images"
ON storage.objects FOR SELECT
USING (bucket_id = 'dish-images');

CREATE POLICY "Admins can upload dish images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dish-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update dish images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'dish-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete dish images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dish-images' AND has_role(auth.uid(), 'admin'::app_role));