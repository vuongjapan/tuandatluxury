
-- Table for special dates (holidays, peak days, etc.)
CREATE TABLE public.special_date_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for per-room prices on special dates
CREATE TABLE public.special_room_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  special_date_id UUID NOT NULL REFERENCES public.special_date_prices(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one price per room per special date
ALTER TABLE public.special_room_prices ADD CONSTRAINT unique_special_room_date UNIQUE (special_date_id, room_id);

-- Enable RLS
ALTER TABLE public.special_date_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_room_prices ENABLE ROW LEVEL SECURITY;

-- RLS for special_date_prices
CREATE POLICY "Admins can manage special dates" ON public.special_date_prices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view special dates" ON public.special_date_prices FOR SELECT TO anon, authenticated
  USING (true);

-- RLS for special_room_prices
CREATE POLICY "Admins can manage special room prices" ON public.special_room_prices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view special room prices" ON public.special_room_prices FOR SELECT TO anon, authenticated
  USING (true);

-- Index for fast lookups
CREATE INDEX idx_special_date_prices_date ON public.special_date_prices(date);
CREATE INDEX idx_special_room_prices_date_room ON public.special_room_prices(special_date_id, room_id);
