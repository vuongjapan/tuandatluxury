
-- Reviews table only (site_settings already exists with text value)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  room_type TEXT,
  stay_date DATE,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved reviews"
  ON public.reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Public can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (length(guest_name) > 0 AND length(content) > 0 AND rating BETWEEN 1 AND 5);

CREATE POLICY "Admins manage reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed default settings into existing site_settings (value = TEXT JSON)
INSERT INTO public.site_settings (key, value) VALUES
  ('member_discounts', '{"room_percent": 10, "food_percent": 15, "code": "MEMBER2025"}'),
  ('per_person_combo', '{"enabled": false}'),
  ('restaurant_phone', '{"phone": "0384418811"}')
ON CONFLICT (key) DO NOTHING;
