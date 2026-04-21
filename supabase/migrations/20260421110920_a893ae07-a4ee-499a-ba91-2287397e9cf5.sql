ALTER TABLE public.discount_config
ADD COLUMN IF NOT EXISTS min_individual_per_person integer NOT NULL DEFAULT 300000;