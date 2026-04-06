
-- Add discount tracking columns to food_orders
ALTER TABLE public.food_orders
ADD COLUMN IF NOT EXISTS discount_code text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_value integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_amount integer DEFAULT 0;

-- Add discount_code to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS discount_code text DEFAULT NULL;
