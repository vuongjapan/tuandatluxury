-- Room popup settings: cho admin tùy biến popup chi tiết phòng
CREATE TABLE public.room_popup_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL UNIQUE,
  badge_vi TEXT,
  badge_en TEXT,
  badge_color TEXT DEFAULT 'gold',
  cta_primary_vi TEXT DEFAULT 'Đặt ngay',
  cta_primary_en TEXT DEFAULT 'Book Now',
  cta_secondary_vi TEXT DEFAULT 'Chat tư vấn',
  cta_secondary_en TEXT DEFAULT 'Chat with us',
  highlights_vi TEXT[] DEFAULT '{}',
  highlights_en TEXT[] DEFAULT '{}',
  policy_vi TEXT,
  policy_en TEXT,
  short_pitch_vi TEXT,
  short_pitch_en TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.room_popup_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active popup settings"
  ON public.room_popup_settings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage popup settings"
  ON public.room_popup_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_room_popup_settings_updated
BEFORE UPDATE ON public.room_popup_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Per-image captions (mở rộng room_images với caption_vi/en + sort)
ALTER TABLE public.room_images
  ADD COLUMN IF NOT EXISTS caption_vi TEXT,
  ADD COLUMN IF NOT EXISTS caption_en TEXT;