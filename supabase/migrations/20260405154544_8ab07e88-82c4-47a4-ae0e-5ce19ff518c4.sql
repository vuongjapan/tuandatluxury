CREATE TABLE public.nearby_attractions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_vi text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  distance text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '📍',
  image_url text,
  description_vi text,
  description_en text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.nearby_attractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active attractions"
ON public.nearby_attractions FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage attractions"
ON public.nearby_attractions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default data
INSERT INTO public.nearby_attractions (name_vi, name_en, distance, icon, sort_order) VALUES
('Bãi biển Sầm Sơn', 'Sầm Sơn Beach', '50m', '🏖️', 0),
('Quảng trường biển', 'Beach Square', '2 phút xe', '🌊', 1),
('Công viên nước', 'Water Park', '5 phút xe', '🎢', 2),
('Đền Độc Cước', 'Doc Cuoc Temple', '10 phút xe', '⛩️', 3),
('Hòn Trống Mái', 'Trong Mai Rock', '12 phút xe', '🪨', 4),
('Sân Golf FLC', 'FLC Golf Course', '3 phút xe', '⛳', 5);