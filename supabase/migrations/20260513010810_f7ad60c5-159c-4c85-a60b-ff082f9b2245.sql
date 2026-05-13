CREATE TABLE IF NOT EXISTS public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_key text NOT NULL UNIQUE,
  vi_text text NOT NULL,
  en_text text,
  ja_text text,
  zh_text text,
  ko_text text,
  content_type text DEFAULT 'ui',
  last_translated timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_translations_key ON public.translations(translation_key);
CREATE INDEX IF NOT EXISTS idx_translations_type ON public.translations(content_type);

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "translations_public_read"
  ON public.translations FOR SELECT
  USING (true);

CREATE POLICY "translations_admin_insert"
  ON public.translations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "translations_admin_update"
  ON public.translations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "translations_admin_delete"
  ON public.translations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();