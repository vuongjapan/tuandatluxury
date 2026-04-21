-- Drop old promotions table (replaced by discount_config + flash_sales + discount_codes + global_discounts)
DROP TABLE IF EXISTS public.promotions CASCADE;

-- New configuration table for VIP and group discounts (single row config)
CREATE TABLE public.discount_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vip_tier1_bookings integer NOT NULL DEFAULT 2,
  vip_tier1_discount integer NOT NULL DEFAULT 5,
  vip_tier2_bookings integer NOT NULL DEFAULT 5,
  vip_tier2_discount integer NOT NULL DEFAULT 10,
  vip_applies_to text NOT NULL DEFAULT 'room_only',
  group_min_people integer NOT NULL DEFAULT 30,
  group_discount_min integer NOT NULL DEFAULT 5,
  group_discount_max integer NOT NULL DEFAULT 10,
  group_note text NOT NULL DEFAULT 'Liên hệ trực tiếp để được báo giá đoàn tốt nhất',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view discount config"
  ON public.discount_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage discount config"
  ON public.discount_config FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_discount_config_updated_at
  BEFORE UPDATE ON public.discount_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed default config
INSERT INTO public.discount_config DEFAULT VALUES;

-- User booking counter (auto-increments via trigger when booking is confirmed)
CREATE TABLE public.user_bookings_count (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL UNIQUE,
  total_bookings integer NOT NULL DEFAULT 0,
  current_tier text NOT NULL DEFAULT 'standard',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_bookings_count ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view own booking count"
  ON public.user_bookings_count FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage booking counts"
  ON public.user_bookings_count FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_user_bookings_count_email ON public.user_bookings_count(email);

-- Function to recompute tier when count changes
CREATE OR REPLACE FUNCTION public.recompute_user_tier()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cfg RECORD;
BEGIN
  SELECT vip_tier1_bookings, vip_tier2_bookings INTO cfg FROM public.discount_config LIMIT 1;
  IF cfg IS NULL THEN
    NEW.current_tier := 'standard';
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

CREATE TRIGGER user_bookings_count_recompute
  BEFORE INSERT OR UPDATE OF total_bookings ON public.user_bookings_count
  FOR EACH ROW EXECUTE FUNCTION public.recompute_user_tier();

-- Trigger on bookings: when status becomes 'confirmed', increment counter for that email
CREATE OR REPLACE FUNCTION public.increment_booking_count_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.guest_email IS NULL OR length(trim(NEW.guest_email)) = 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmed') THEN
    INSERT INTO public.user_bookings_count (email, total_bookings)
    VALUES (lower(trim(NEW.guest_email)), 1)
    ON CONFLICT (email) DO UPDATE
      SET total_bookings = public.user_bookings_count.total_bookings + 1;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_increment_user_count
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.increment_booking_count_on_confirm();
