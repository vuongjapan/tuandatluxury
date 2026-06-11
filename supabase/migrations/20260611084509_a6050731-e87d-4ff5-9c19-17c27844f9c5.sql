-- Visitor tracking table for analytics with fingerprinting
CREATE TABLE IF NOT EXISTS public.visitor_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  source_domain text NOT NULL,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  visit_count integer NOT NULL DEFAULT 1,
  pages_this_session jsonb NOT NULL DEFAULT '[]'::jsonb,
  country text,
  country_code text,
  city text,
  device_type text,
  browser text,
  os text,
  screen_resolution text,
  referrer text,
  referrer_source text,
  language text,
  timezone text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (visitor_id, source_domain, session_id)
);

CREATE INDEX IF NOT EXISTS idx_visitor_tracking_visitor ON public.visitor_tracking(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_tracking_domain ON public.visitor_tracking(source_domain);
CREATE INDEX IF NOT EXISTS idx_visitor_tracking_last_seen ON public.visitor_tracking(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_tracking_first_seen ON public.visitor_tracking(first_seen DESC);

GRANT SELECT, INSERT, UPDATE ON public.visitor_tracking TO anon, authenticated;
GRANT ALL ON public.visitor_tracking TO service_role;

ALTER TABLE public.visitor_tracking ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) can insert/update their own tracking record (no auth required for tracking)
CREATE POLICY "Anyone can insert tracking" ON public.visitor_tracking
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update tracking" ON public.visitor_tracking
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Only admins can read tracking data
CREATE POLICY "Admins can read tracking" ON public.visitor_tracking
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete tracking" ON public.visitor_tracking
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- updated_at trigger
CREATE TRIGGER trg_visitor_tracking_updated_at
  BEFORE UPDATE ON public.visitor_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for online-now feature
ALTER TABLE public.visitor_tracking REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_tracking;