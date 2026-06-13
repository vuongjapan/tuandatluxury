ALTER TABLE public.visitors
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS city text;

CREATE INDEX IF NOT EXISTS idx_visitors_country ON public.visitors(country);
CREATE INDEX IF NOT EXISTS idx_visitors_region ON public.visitors(region);