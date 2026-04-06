
-- Flash Sale campaigns
CREATE TABLE public.flash_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  description_vi TEXT,
  description_en TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage flash sales" ON public.flash_sales FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active flash sales" ON public.flash_sales FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER update_flash_sales_updated_at BEFORE UPDATE ON public.flash_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Flash Sale items
CREATE TABLE public.flash_sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flash_sale_id UUID NOT NULL REFERENCES public.flash_sales(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'room', -- room, food, combo
  item_id TEXT NOT NULL, -- room id or menu_item id
  item_name_vi TEXT NOT NULL DEFAULT '',
  item_name_en TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  original_price INTEGER NOT NULL DEFAULT 0,
  sale_price INTEGER NOT NULL DEFAULT 0,
  quantity_limit INTEGER NOT NULL DEFAULT 10,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flash_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage flash sale items" ON public.flash_sale_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view flash sale items" ON public.flash_sale_items FOR SELECT TO anon, authenticated
  USING (true);

-- Discount codes (tickets)
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title_vi TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL DEFAULT 'percent', -- percent, fixed
  discount_value INTEGER NOT NULL DEFAULT 0, -- % or VND amount
  min_order_amount INTEGER NOT NULL DEFAULT 0,
  applies_to TEXT NOT NULL DEFAULT 'all', -- all, room, food
  max_uses INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  max_uses_per_user INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage discount codes" ON public.discount_codes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active discount codes" ON public.discount_codes FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON public.discount_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Global discounts
CREATE TABLE public.global_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_vi TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  discount_percent INTEGER NOT NULL DEFAULT 0,
  applies_to TEXT NOT NULL DEFAULT 'all', -- all, room, food
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  allow_stacking BOOLEAN NOT NULL DEFAULT false,
  max_total_discount INTEGER NOT NULL DEFAULT 30, -- max % total
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.global_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage global discounts" ON public.global_discounts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active global discounts" ON public.global_discounts FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER update_global_discounts_updated_at BEFORE UPDATE ON public.global_discounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Smart pricing rules (manual)
CREATE TABLE public.smart_pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_type TEXT NOT NULL DEFAULT 'early_bird', -- early_bird, day_of_week, occupancy
  title_vi TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  badge_text_vi TEXT,
  badge_text_en TEXT,
  -- early_bird fields
  min_days_advance INTEGER, -- e.g. 30, 60, 90
  -- day_of_week fields  
  day_of_week INTEGER, -- 0=Sun..6=Sat, NULL = all
  specific_date DATE, -- or a specific date
  -- occupancy fields
  occupancy_threshold INTEGER, -- % rooms empty threshold
  -- common
  discount_percent INTEGER NOT NULL DEFAULT 0,
  applies_to TEXT NOT NULL DEFAULT 'room', -- room, food, all
  is_active BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.smart_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage smart pricing" ON public.smart_pricing_rules FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active smart pricing" ON public.smart_pricing_rules FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER update_smart_pricing_updated_at BEFORE UPDATE ON public.smart_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
