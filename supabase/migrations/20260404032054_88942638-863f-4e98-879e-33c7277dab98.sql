
-- Menu items table (separate from dining_items for food ordering)
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_vi text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  description_vi text,
  description_en text,
  price_vnd integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'main',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_popular boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active menu items" ON public.menu_items
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Admins can manage menu items" ON public.menu_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_menu_items_category ON public.menu_items(category);
CREATE INDEX idx_menu_items_price ON public.menu_items(price_vnd);
CREATE INDEX idx_menu_items_popular ON public.menu_items(is_popular) WHERE is_popular = true;

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Food orders table
CREATE TABLE public.food_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  food_order_id text NOT NULL UNIQUE,
  booking_code text,
  customer_name text NOT NULL,
  phone text NOT NULL,
  room_number text,
  total_amount integer NOT NULL DEFAULT 0,
  paid_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'PENDING',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.food_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert food orders" ON public.food_orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (customer_name IS NOT NULL AND phone IS NOT NULL);

CREATE POLICY "Public can view food orders" ON public.food_orders
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage food orders" ON public.food_orders
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_food_orders_booking ON public.food_orders(booking_code);
CREATE INDEX idx_food_orders_status ON public.food_orders(status);

CREATE TRIGGER update_food_orders_updated_at
  BEFORE UPDATE ON public.food_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Food order items table
CREATE TABLE public.food_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  food_order_id uuid NOT NULL REFERENCES public.food_orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id),
  quantity integer NOT NULL DEFAULT 1,
  price_vnd integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.food_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert food order items" ON public.food_order_items
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public can view food order items" ON public.food_order_items
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage food order items" ON public.food_order_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_food_order_items_order ON public.food_order_items(food_order_id);
