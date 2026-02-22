
-- Create dining categories table
CREATE TABLE public.dining_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_vi TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_vi TEXT,
  description_en TEXT,
  image_url TEXT,
  serving_hours TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dining_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active dining categories"
  ON public.dining_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage dining categories"
  ON public.dining_categories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_dining_categories_updated_at
  BEFORE UPDATE ON public.dining_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create dining items table
CREATE TABLE public.dining_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.dining_categories(id) ON DELETE CASCADE,
  name_vi TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_vi TEXT,
  description_en TEXT,
  image_url TEXT,
  price_vnd INTEGER NOT NULL DEFAULT 0,
  is_combo BOOLEAN NOT NULL DEFAULT false,
  combo_serves INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dining_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active dining items"
  ON public.dining_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage dining items"
  ON public.dining_items FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_dining_items_updated_at
  BEFORE UPDATE ON public.dining_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed default categories
INSERT INTO public.dining_categories (slug, name_vi, name_en, description_vi, description_en, serving_hours, sort_order) VALUES
  ('seafood', 'Hải sản tươi sống', 'Fresh Seafood', 'Hải sản tươi sống được đánh bắt hàng ngày từ biển Đà Nẵng', 'Fresh seafood caught daily from Da Nang coast', '10:00 - 22:00', 1),
  ('family', 'Món gia đình', 'Family Dishes', 'Các món ăn truyền thống Việt Nam dành cho gia đình', 'Traditional Vietnamese family-style dishes', '06:00 - 22:00', 2),
  ('combo', 'COMBO đoàn/nhóm', 'Group Combos', 'Combo tiết kiệm dành cho đoàn và nhóm đông người', 'Cost-effective combo packages for groups', '10:00 - 22:00', 3),
  ('buffet', 'Buffet sáng', 'Breakfast Buffet', 'Buffet sáng đa dạng với các món Á - Âu', 'Diverse breakfast buffet with Asian & Western cuisine', '06:00 - 10:00', 4),
  ('room-service', 'Ăn tại phòng', 'Room Service', 'Menu rút gọn phục vụ tận phòng 24/7', 'Abbreviated menu delivered to your room 24/7', '06:00 - 23:00', 5);

-- Create storage bucket for dining images
INSERT INTO storage.buckets (id, name, public) VALUES ('dining', 'dining', true);

CREATE POLICY "Public can view dining images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dining');

CREATE POLICY "Admins can manage dining images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'dining' AND has_role(auth.uid(), 'admin'::app_role));
