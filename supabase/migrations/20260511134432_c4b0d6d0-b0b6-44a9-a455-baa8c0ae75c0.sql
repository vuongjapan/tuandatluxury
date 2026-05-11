
CREATE TABLE IF NOT EXISTS public.page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  description_vi text,
  description_en text,
  slideshow jsonb DEFAULT '[]'::jsonb,
  gallery jsonb DEFAULT '[]'::jsonb,
  video_url text,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view page sections"
  ON public.page_sections FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert page sections"
  ON public.page_sections FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update page sections"
  ON public.page_sections FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete page sections"
  ON public.page_sections FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_page_sections_updated_at
  BEFORE UPDATE ON public.page_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
