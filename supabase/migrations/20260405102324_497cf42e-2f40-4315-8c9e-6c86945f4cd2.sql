
-- Combo packages (225K, 275K, 375K, 550K)
CREATE TABLE public.combo_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_per_person integer NOT NULL DEFAULT 0,
  image_url text,
  description_vi text,
  description_en text,
  menu_count integer NOT NULL DEFAULT 4,
  dishes_per_menu integer NOT NULL DEFAULT 10,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.combo_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active combos" ON public.combo_packages
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Admins can manage combos" ON public.combo_packages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Combo menus (4 per combo)
CREATE TABLE public.combo_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_package_id uuid NOT NULL REFERENCES public.combo_packages(id) ON DELETE CASCADE,
  menu_number integer NOT NULL DEFAULT 1,
  name_vi text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.combo_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active menus" ON public.combo_menus
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Admins can manage menus" ON public.combo_menus
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Dishes in each menu
CREATE TABLE public.combo_menu_dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_menu_id uuid NOT NULL REFERENCES public.combo_menus(id) ON DELETE CASCADE,
  name_vi text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.combo_menu_dishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view dishes" ON public.combo_menu_dishes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage dishes" ON public.combo_menu_dishes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
