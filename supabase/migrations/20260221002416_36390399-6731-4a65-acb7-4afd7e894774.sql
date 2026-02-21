
-- Table for manual per-day price overrides
CREATE TABLE public.room_price_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  override_date date NOT NULL,
  price_vnd integer NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, override_date)
);

ALTER TABLE public.room_price_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view price overrides"
ON public.room_price_overrides FOR SELECT
USING (true);

CREATE POLICY "Admins can manage price overrides"
ON public.room_price_overrides FOR ALL
USING (public.has_role(auth.uid(), 'admin'));
