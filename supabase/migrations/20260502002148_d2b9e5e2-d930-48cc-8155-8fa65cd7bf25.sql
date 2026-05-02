
ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS full_url text,
  ADD COLUMN IF NOT EXISTS page_label text;

CREATE INDEX IF NOT EXISTS idx_page_views_domain ON public.page_views(domain);
CREATE INDEX IF NOT EXISTS idx_page_views_domain_date ON public.page_views(domain, date DESC);
