
-- Add promo_type and group discount tiers to promotions
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS promo_type text NOT NULL DEFAULT 'seasonal';
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS group_discount_tiers jsonb DEFAULT '[]'::jsonb;

-- Add promotion tracking to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promotion_id uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promotion_discount_percent integer DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promotion_discount_amount integer DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS member_discount_percent integer DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS member_discount_amount integer DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS group_size integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS special_services text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS decoration_notes text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS original_price_vnd integer DEFAULT 0;
