CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usd_rate numeric NOT NULL DEFAULT 25400,
  jpy_rate numeric NOT NULL DEFAULT 168,
  cny_rate numeric NOT NULL DEFAULT 3500,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view exchange rates"
  ON public.exchange_rates FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage exchange rates"
  ON public.exchange_rates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.exchange_rates (usd_rate, jpy_rate, cny_rate)
SELECT 25400, 168, 3500
WHERE NOT EXISTS (SELECT 1 FROM public.exchange_rates);