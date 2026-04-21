-- Add display fields for homepage service cards
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS badge_text TEXT,
  ADD COLUMN IF NOT EXISTS badge_color TEXT DEFAULT 'gold',
  ADD COLUMN IF NOT EXISTS button_text TEXT,
  ADD COLUMN IF NOT EXISTS button_link TEXT,
  ADD COLUMN IF NOT EXISTS homepage_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_services_homepage_featured
  ON public.services (homepage_featured, sort_order)
  WHERE homepage_featured = true AND is_active = true;