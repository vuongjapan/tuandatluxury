
-- Voucher codes table for batch coupon generation
CREATE TABLE public.voucher_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value INTEGER NOT NULL DEFAULT 0,
  campaign_name TEXT NOT NULL DEFAULT '',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  usage_limit INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voucher_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage voucher codes"
  ON public.voucher_codes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active voucher codes for validation"
  ON public.voucher_codes FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE TRIGGER update_voucher_codes_updated_at
  BEFORE UPDATE ON public.voucher_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert default web discount setting
INSERT INTO public.site_settings (key, value) 
VALUES ('web_discount_percent', '5')
ON CONFLICT (key) DO NOTHING;
