-- Create page_views table for analytics tracking
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL DEFAULT 'other',
  page_path TEXT,
  room_id TEXT,
  room_name TEXT,
  visitor_id TEXT,
  session_id TEXT,
  referrer TEXT,
  referrer_source TEXT,
  device TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
);

-- Indexes for fast aggregation
CREATE INDEX idx_page_views_date ON public.page_views(date DESC);
CREATE INDEX idx_page_views_viewed_at ON public.page_views(viewed_at DESC);
CREATE INDEX idx_page_views_page_type ON public.page_views(page_type);
CREATE INDEX idx_page_views_room_id ON public.page_views(room_id) WHERE room_id IS NOT NULL;
CREATE INDEX idx_page_views_visitor_id ON public.page_views(visitor_id);
CREATE INDEX idx_page_views_referrer_source ON public.page_views(referrer_source);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Public can insert (anonymous tracking)
CREATE POLICY "Public can insert page views"
ON public.page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view aggregated data
CREATE POLICY "Admins can view page views"
ON public.page_views
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete (cleanup)
CREATE POLICY "Admins can delete page views"
ON public.page_views
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));