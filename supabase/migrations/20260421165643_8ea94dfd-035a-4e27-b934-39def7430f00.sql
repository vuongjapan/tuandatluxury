CREATE TABLE public.promo_popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'bottom-left',
  display_delay_seconds INTEGER NOT NULL DEFAULT 3,
  dismiss_duration_hours INTEGER NOT NULL DEFAULT 24,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active popups"
ON public.promo_popups
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage popups"
ON public.promo_popups
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.set_promo_popups_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_promo_popups_updated_at
BEFORE UPDATE ON public.promo_popups
FOR EACH ROW
EXECUTE FUNCTION public.set_promo_popups_updated_at();