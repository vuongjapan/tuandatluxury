-- Auction items (admin manually selects which products to put on auction)
CREATE TABLE public.auction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_vi TEXT NOT NULL,
  title_en TEXT DEFAULT '',
  item_type TEXT NOT NULL DEFAULT 'room', -- 'room' | 'combo'
  ref_id TEXT, -- optional link to rooms.id or combo_packages.id
  image_url TEXT,
  description_vi TEXT,
  list_price INTEGER NOT NULL DEFAULT 0,        -- giá niêm yết (gạch ngang)
  start_price INTEGER NOT NULL DEFAULT 0,       -- giá khởi điểm
  bid_step INTEGER NOT NULL DEFAULT 50000,      -- bước giá
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active auctions"
ON public.auction_items FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins manage auctions"
ON public.auction_items FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_auction_items_updated_at
BEFORE UPDATE ON public.auction_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Bids
CREATE TABLE public.auction_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_item_id UUID NOT NULL REFERENCES public.auction_items(id) ON DELETE CASCADE,
  bidder_name TEXT NOT NULL,
  bidder_phone TEXT NOT NULL,
  bid_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auction_bids_item ON public.auction_bids(auction_item_id, bid_amount DESC);

ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

-- Public can insert valid bids; bid_amount must be >= start_price + bid_step base check is in app, but we ensure bid > 0 here
CREATE POLICY "Public can insert bids"
ON public.auction_bids FOR INSERT
WITH CHECK (
  bid_amount > 0
  AND length(bidder_name) > 0
  AND length(bidder_phone) >= 8
);

-- Public can read bids (anonymized in UI). Admins see full.
CREATE POLICY "Public can view bids"
ON public.auction_bids FOR SELECT
USING (true);

CREATE POLICY "Admins manage bids"
ON public.auction_bids FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Live sessions
CREATE TABLE public.live_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_vi TEXT NOT NULL DEFAULT 'Livestream Tuấn Đạt Luxury',
  mode TEXT NOT NULL DEFAULT 'youtube', -- 'webrtc' | 'tiktok' | 'facebook' | 'youtube'
  embed_url TEXT,                       -- url for embed mode
  product_type TEXT,                    -- 'room' | 'combo' | 'auction'
  product_ref_id TEXT,                  -- rooms.id / combo_packages.id / auction_items.id
  product_title TEXT,
  product_image TEXT,
  product_price INTEGER NOT NULL DEFAULT 0,
  cta_label TEXT NOT NULL DEFAULT 'Đặt ngay',
  cta_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view live sessions"
ON public.live_sessions FOR SELECT
USING (true);

CREATE POLICY "Admins manage live sessions"
ON public.live_sessions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_live_sessions_updated_at
BEFORE UPDATE ON public.live_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
ALTER TABLE public.auction_bids REPLICA IDENTITY FULL;
ALTER TABLE public.auction_items REPLICA IDENTITY FULL;
ALTER TABLE public.live_sessions REPLICA IDENTITY FULL;