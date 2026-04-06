
CREATE TABLE public.cuisine_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL DEFAULT 'image',
  title text,
  caption text,
  media_url text NOT NULL,
  thumbnail_url text,
  media_group text DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cuisine_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active cuisine media"
  ON public.cuisine_media FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage cuisine media"
  ON public.cuisine_media FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_cuisine_media_updated_at
  BEFORE UPDATE ON public.cuisine_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
