
ALTER TABLE public.discount_config
  ADD COLUMN IF NOT EXISTS vip_tier3_bookings integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS vip_tier3_discount integer NOT NULL DEFAULT 10;

-- Reseed sensible non-overlapping defaults if rows are still at the old values
UPDATE public.discount_config
SET vip_tier1_bookings = 2, vip_tier1_discount = 5,
    vip_tier2_bookings = 3, vip_tier2_discount = 8,
    vip_tier3_bookings = 5, vip_tier3_discount = 10
WHERE vip_tier2_bookings = 5 AND vip_tier2_discount = 10;

-- Update tier recomputation to support 3 tiers (highest wins)
CREATE OR REPLACE FUNCTION public.recompute_user_tier()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cfg RECORD;
BEGIN
  SELECT vip_tier1_bookings, vip_tier2_bookings, vip_tier3_bookings
    INTO cfg FROM public.discount_config LIMIT 1;
  IF cfg IS NULL THEN
    NEW.current_tier := 'standard';
  ELSIF NEW.total_bookings >= cfg.vip_tier3_bookings THEN
    NEW.current_tier := 'vip3';
  ELSIF NEW.total_bookings >= cfg.vip_tier2_bookings THEN
    NEW.current_tier := 'vip2';
  ELSIF NEW.total_bookings >= cfg.vip_tier1_bookings THEN
    NEW.current_tier := 'vip1';
  ELSE
    NEW.current_tier := 'standard';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
