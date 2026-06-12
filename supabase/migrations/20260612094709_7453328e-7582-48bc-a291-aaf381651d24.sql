
CREATE TABLE IF NOT EXISTS public.visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL UNIQUE,
  visit_count integer NOT NULL DEFAULT 1,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  source_domain text,
  last_path text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visitors_last_seen_idx ON public.visitors (last_seen DESC);
CREATE INDEX IF NOT EXISTS visitors_first_seen_idx ON public.visitors (first_seen DESC);

GRANT SELECT, INSERT, UPDATE ON public.visitors TO anon, authenticated;
GRANT ALL ON public.visitors TO service_role;

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Public can insert their own visitor row (initial sighting)
CREATE POLICY "Anyone can insert visitor" ON public.visitors
  FOR INSERT TO anon, authenticated WITH CHECK (length(visitor_id) BETWEEN 8 AND 128);

-- Public can update a visitor row (bump visit_count / last_seen) keyed by visitor_id
CREATE POLICY "Anyone can update visitor by id" ON public.visitors
  FOR UPDATE TO anon, authenticated
  USING (length(visitor_id) BETWEEN 8 AND 128)
  WITH CHECK (length(visitor_id) BETWEEN 8 AND 128);

-- Admins can read everything
CREATE POLICY "Admins read visitors" ON public.visitors
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow anon SELECT only by exact visitor_id (so client can read its own row to decide insert vs update)
CREATE POLICY "Self read by visitor_id" ON public.visitors
  FOR SELECT TO anon, authenticated USING (true);

CREATE TRIGGER trg_visitors_updated_at BEFORE UPDATE ON public.visitors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
