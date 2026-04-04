
CREATE TABLE public.booking_combos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  dining_item_id UUID NOT NULL REFERENCES public.dining_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_vnd INTEGER NOT NULL DEFAULT 0,
  combo_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_combos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view booking combos"
ON public.booking_combos FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public can insert booking combos"
ON public.booking_combos FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can manage booking combos"
ON public.booking_combos FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
