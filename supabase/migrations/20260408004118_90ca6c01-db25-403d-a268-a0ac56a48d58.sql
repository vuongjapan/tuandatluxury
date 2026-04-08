CREATE TABLE public.room_amenities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL DEFAULT 'room_features',
  name_vi text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '✓',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.room_amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage room amenities"
ON public.room_amenities FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active room amenities"
ON public.room_amenities FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE TRIGGER update_room_amenities_updated_at
BEFORE UPDATE ON public.room_amenities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();