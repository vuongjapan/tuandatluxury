
CREATE TABLE public.room_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_number, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_revenue TO authenticated;
GRANT ALL ON public.room_revenue TO service_role;

ALTER TABLE public.room_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view room_revenue"
  ON public.room_revenue FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert room_revenue"
  ON public.room_revenue FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update room_revenue"
  ON public.room_revenue FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete room_revenue"
  ON public.room_revenue FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_room_revenue_updated_at
  BEFORE UPDATE ON public.room_revenue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_room_revenue_date ON public.room_revenue(date);
CREATE INDEX idx_room_revenue_room ON public.room_revenue(room_number);
