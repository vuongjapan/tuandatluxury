
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS extra_person_surcharge integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_person_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS individual_food_total integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS combo_notes text;

CREATE TABLE IF NOT EXISTS public.booking_food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  price_vnd integer NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage booking food items"
ON public.booking_food_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can insert booking food items"
ON public.booking_food_items FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can view booking food items"
ON public.booking_food_items FOR SELECT TO anon, authenticated
USING (true);
