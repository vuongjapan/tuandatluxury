
-- Bảng giá theo tháng cho từng loại phòng
CREATE TABLE public.room_monthly_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  price_weekday integer NOT NULL DEFAULT 0,
  price_weekend integer NOT NULL DEFAULT 0,
  price_sunday integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, year, month)
);

-- Trạng thái bán phòng theo ngày (thủ công)
CREATE TABLE public.room_daily_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'limited')),
  rooms_available integer NOT NULL DEFAULT 1,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, date)
);

-- RLS
ALTER TABLE public.room_monthly_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_daily_availability ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public can view monthly prices" ON public.room_monthly_prices FOR SELECT USING (true);
CREATE POLICY "Public can view daily availability" ON public.room_daily_availability FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admins can manage monthly prices" ON public.room_monthly_prices FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage daily availability" ON public.room_daily_availability FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_room_monthly_prices_updated_at BEFORE UPDATE ON public.room_monthly_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_room_daily_availability_updated_at BEFORE UPDATE ON public.room_daily_availability FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
