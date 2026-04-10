ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS room_subtotal integer NOT NULL DEFAULT 0;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS combo_total integer NOT NULL DEFAULT 0;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS room_details jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS room_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.booking_combos
  ALTER COLUMN dining_item_id DROP NOT NULL;

ALTER TABLE public.booking_combos
  ADD COLUMN IF NOT EXISTS combo_package_id uuid REFERENCES public.combo_packages(id) ON DELETE SET NULL;

ALTER TABLE public.booking_combos
  ADD COLUMN IF NOT EXISTS combo_menu_id uuid REFERENCES public.combo_menus(id) ON DELETE SET NULL;

ALTER TABLE public.booking_combos
  ADD COLUMN IF NOT EXISTS combo_package_name text;

ALTER TABLE public.booking_combos
  ADD COLUMN IF NOT EXISTS combo_menu_name text;

ALTER TABLE public.booking_combos
  ADD COLUMN IF NOT EXISTS dishes_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_booking_combos_combo_package_id ON public.booking_combos(combo_package_id);
CREATE INDEX IF NOT EXISTS idx_booking_combos_combo_menu_id ON public.booking_combos(combo_menu_id);

UPDATE public.booking_combos
SET combo_package_name = COALESCE(combo_package_name, NULLIF(split_part(COALESCE(combo_name, ''), ' – ', 1), '')),
    combo_menu_name = COALESCE(
      combo_menu_name,
      CASE
        WHEN position(' – ' in COALESCE(combo_name, '')) > 0 THEN regexp_replace(COALESCE(combo_name, ''), '^[^–]+ – ', '')
        ELSE NULL
      END
    )
WHERE combo_package_name IS NULL OR combo_menu_name IS NULL;

WITH booking_totals AS (
  SELECT
    b.id AS booking_id,
    COALESCE(SUM(bc.price_vnd * bc.quantity), 0) AS combo_total,
    GREATEST(
      0,
      COALESCE(b.original_price_vnd, b.total_price_vnd, 0)
      - COALESCE(SUM(bc.price_vnd * bc.quantity), 0)
      - COALESCE(b.individual_food_total, 0)
      - COALESCE(b.extra_person_surcharge, 0)
    ) AS room_subtotal,
    COALESCE(r.name_vi, b.room_id) AS room_name,
    GREATEST((b.check_out - b.check_in), 1) AS nights,
    COALESCE(b.room_quantity, 1) AS room_quantity
  FROM public.bookings b
  LEFT JOIN public.booking_combos bc ON bc.booking_id = b.id
  LEFT JOIN public.rooms r ON r.id = b.room_id
  GROUP BY b.id, r.name_vi
)
UPDATE public.bookings b
SET combo_total = bt.combo_total,
    room_subtotal = bt.room_subtotal,
    room_details = CASE
      WHEN jsonb_typeof(b.room_details) = 'array' AND jsonb_array_length(b.room_details) > 0 THEN b.room_details
      ELSE jsonb_build_array(
        jsonb_build_object(
          'room_id', b.room_id,
          'room_name', bt.room_name,
          'quantity', bt.room_quantity
        )
      )
    END,
    room_breakdown = CASE
      WHEN jsonb_typeof(b.room_breakdown) = 'array' AND jsonb_array_length(b.room_breakdown) > 0 THEN b.room_breakdown
      ELSE jsonb_build_array(
        jsonb_build_object(
          'room_id', b.room_id,
          'room_name', bt.room_name,
          'quantity', bt.room_quantity,
          'subtotal', bt.room_subtotal,
          'average_nightly_rate', CASE
            WHEN bt.nights > 0 AND bt.room_quantity > 0 THEN ROUND(bt.room_subtotal::numeric / (bt.nights * bt.room_quantity))::integer
            ELSE 0
          END
        )
      )
    END
FROM booking_totals bt
WHERE bt.booking_id = b.id;