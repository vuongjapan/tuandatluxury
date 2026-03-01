
-- Key-value settings table for admin-managed site config
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage site settings"
ON public.site_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed default values
INSERT INTO public.site_settings (key, value) VALUES
  ('map_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3749.123!2d105.9!3d19.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDQ1JzAwLjAiTiAxMDXCsDU0JzAwLjAiRQ!5e0!3m2!1sen!2s!4v1'),
  ('platform_booking_url', 'https://www.booking.com'),
  ('platform_booking_name', 'Booking.com'),
  ('platform_agoda_url', 'https://www.agoda.com'),
  ('platform_agoda_name', 'Agoda');
