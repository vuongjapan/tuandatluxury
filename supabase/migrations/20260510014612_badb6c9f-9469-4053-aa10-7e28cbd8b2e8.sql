-- Pool drink orders
CREATE TABLE public.pool_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text UNIQUE NOT NULL,
  guest_name text,
  guest_phone text,
  room_number text,
  seat_location text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total integer NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pool_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert pool order" ON public.pool_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "admin all pool orders" ON public.pool_orders FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER pool_orders_updated BEFORE UPDATE ON public.pool_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Pool special service requests
CREATE TABLE public.pool_special_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code text UNIQUE NOT NULL,
  service_types text[] NOT NULL DEFAULT '{}',
  event_date date,
  event_time time,
  num_people integer,
  guest_name text NOT NULL,
  guest_phone text NOT NULL,
  room_number text,
  requirements text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pool_special_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert pool req" ON public.pool_special_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "admin all pool req" ON public.pool_special_requests FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER pool_req_updated BEFORE UPDATE ON public.pool_special_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Restaurant reservations
CREATE TABLE public.restaurant_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_code text UNIQUE NOT NULL,
  guest_name text NOT NULL,
  guest_phone text NOT NULL,
  guest_email text,
  room_number text,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  num_people integer NOT NULL DEFAULT 1,
  special_requests text[] DEFAULT '{}',
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.restaurant_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert reservation" ON public.restaurant_reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "admin all reservations" ON public.restaurant_reservations FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER reservations_updated BEFORE UPDATE ON public.restaurant_reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Venue media (gallery for pool & restaurant)
CREATE TABLE public.venue_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_type text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  thumbnail_url text,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.venue_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read venue_media" ON public.venue_media FOR SELECT USING (true);
CREATE POLICY "admin manage venue_media" ON public.venue_media FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Pool menu items (drinks, snacks)
CREATE TABLE public.pool_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'drink',
  price integer NOT NULL DEFAULT 0,
  image_url text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pool_menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pool_menu" ON public.pool_menu_items FOR SELECT USING (true);
CREATE POLICY "admin manage pool_menu" ON public.pool_menu_items FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER pool_menu_updated BEFORE UPDATE ON public.pool_menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed some default pool menu items
INSERT INTO public.pool_menu_items (name, category, price, sort_order) VALUES
  ('Nước dừa tươi', 'drink', 45000, 1),
  ('Fresh juice', 'drink', 55000, 2),
  ('Bia lon', 'drink', 35000, 3),
  ('Cocktail', 'drink', 85000, 4),
  ('Nước lọc', 'drink', 15000, 5),
  ('Trái cây cắt', 'snack', 65000, 6),
  ('Khoai tây chiên', 'snack', 45000, 7);