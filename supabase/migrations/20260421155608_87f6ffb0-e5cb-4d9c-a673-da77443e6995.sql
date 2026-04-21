-- 1. Add price_type to menu_items + dining_items
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS price_type text NOT NULL DEFAULT 'fixed';

ALTER TABLE public.dining_items
  ADD COLUMN IF NOT EXISTS price_type text NOT NULL DEFAULT 'fixed';

-- Constrain values
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_price_type_check') THEN
    ALTER TABLE public.menu_items
      ADD CONSTRAINT menu_items_price_type_check CHECK (price_type IN ('fixed','negotiable'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dining_items_price_type_check') THEN
    ALTER TABLE public.dining_items
      ADD CONSTRAINT dining_items_price_type_check CHECK (price_type IN ('fixed','negotiable'));
  END IF;
END $$;

-- 2. Meal time on bookings (single value for the whole booking)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS meal_time text,
  ADD COLUMN IF NOT EXISTS meal_time_label text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_meal_time_check') THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_meal_time_check CHECK (meal_time IS NULL OR meal_time IN ('lunch','dinner','both'));
  END IF;
END $$;

-- 3. Meal time on each booking line (combos + food items)
ALTER TABLE public.booking_combos
  ADD COLUMN IF NOT EXISTS meal_time text,
  ADD COLUMN IF NOT EXISTS meal_multiplier integer NOT NULL DEFAULT 1;

ALTER TABLE public.booking_food_items
  ADD COLUMN IF NOT EXISTS meal_time text,
  ADD COLUMN IF NOT EXISTS meal_multiplier integer NOT NULL DEFAULT 1;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_combos_meal_time_check') THEN
    ALTER TABLE public.booking_combos
      ADD CONSTRAINT booking_combos_meal_time_check CHECK (meal_time IS NULL OR meal_time IN ('lunch','dinner','both'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_food_items_meal_time_check') THEN
    ALTER TABLE public.booking_food_items
      ADD CONSTRAINT booking_food_items_meal_time_check CHECK (meal_time IS NULL OR meal_time IN ('lunch','dinner','both'));
  END IF;
END $$;