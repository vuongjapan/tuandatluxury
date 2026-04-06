
-- Add discount code details to bookings for invoice display
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_code_amount integer DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_code_type text DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_code_value integer DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promotion_name text DEFAULT NULL;

-- Add applies_to_items (jsonb array of item IDs) to promotion tables
ALTER TABLE public.discount_codes ADD COLUMN IF NOT EXISTS applies_to_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.global_discounts ADD COLUMN IF NOT EXISTS applies_to_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.smart_pricing_rules ADD COLUMN IF NOT EXISTS applies_to_items jsonb DEFAULT '[]'::jsonb;
