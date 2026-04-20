
-- 1. Live comments (realtime)
CREATE TABLE IF NOT EXISTS public.live_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT 'Khách',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.live_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view comments" ON public.live_comments FOR SELECT USING (true);
CREATE POLICY "Public can insert comments" ON public.live_comments FOR INSERT WITH CHECK (length(content) > 0 AND length(content) <= 500);
CREATE POLICY "Admins manage comments" ON public.live_comments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Live reactions (hearts/icons flying)
CREATE TABLE IF NOT EXISTS public.live_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  icon TEXT NOT NULL DEFAULT '❤️',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.live_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view reactions" ON public.live_reactions FOR SELECT USING (true);
CREATE POLICY "Public can insert reactions" ON public.live_reactions FOR INSERT WITH CHECK (icon IN ('❤️','👍','🔥','😍','👏'));
CREATE POLICY "Admins manage reactions" ON public.live_reactions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. Live recordings (video archive)
CREATE TABLE IF NOT EXISTS public.live_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Video live',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_sec INTEGER DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.live_recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view visible recordings" ON public.live_recordings FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins manage recordings" ON public.live_recordings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_live_recordings_updated BEFORE UPDATE ON public.live_recordings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Extend live_sessions for mock-live mode + viewer tracking
ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS viewer_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS current_recording_id UUID REFERENCES public.live_recordings(id) ON DELETE SET NULL;

-- Allow public to bump viewer_count via update (only that column would be ideal but we keep it simple — bump is server-side only via admin or RPC). For now keep update admin-only.

-- 5. Unified menu/combo + show price toggle
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS is_combo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_price BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.dining_items
  ADD COLUMN IF NOT EXISTS show_price BOOLEAN NOT NULL DEFAULT true;

-- 6. Storage bucket for uploaded "live" videos & thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('live-videos', 'live-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read live videos" ON storage.objects FOR SELECT USING (bucket_id = 'live-videos');
CREATE POLICY "Admins upload live videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'live-videos' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update live videos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'live-videos' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete live videos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'live-videos' AND has_role(auth.uid(),'admin'));

-- 7. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_recordings;
