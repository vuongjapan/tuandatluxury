
-- 1. Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. User roles table (separate from profiles!)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Rooms table (synced with frontend data)
CREATE TABLE public.rooms (
  id TEXT PRIMARY KEY,
  name_vi TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ja TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  description_vi TEXT,
  description_en TEXT,
  description_ja TEXT,
  description_zh TEXT,
  price_vnd INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 2,
  size_sqm INTEGER NOT NULL DEFAULT 25,
  amenities TEXT[] DEFAULT '{}',
  weekend_multiplier NUMERIC(4,2) DEFAULT 1.3,
  peak_multiplier NUMERIC(4,2) DEFAULT 1.5,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active rooms" ON public.rooms
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage rooms" ON public.rooms
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT UNIQUE NOT NULL DEFAULT 'TDL-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)),
  room_id TEXT NOT NULL REFERENCES public.rooms(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT NOT NULL,
  guest_notes TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 2,
  total_price_vnd INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','checked_in','checked_out')),
  language TEXT DEFAULT 'vi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Guests can view own booking by code" ON public.bookings
  FOR SELECT USING (true);

-- 6. Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL DEFAULT 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6)),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_vnd INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'issued' CHECK (status IN ('issued','paid','cancelled'))
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage invoices" ON public.invoices
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can view invoices" ON public.invoices
  FOR SELECT USING (true);

-- 7. Chat history
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert/read chat messages" ON public.chat_messages
  FOR ALL USING (true);

-- 8. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 9. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Default role = 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Seed room data
INSERT INTO public.rooms (id, name_vi, name_en, name_ja, name_zh, description_vi, description_en, description_ja, description_zh, price_vnd, capacity, size_sqm, amenities, weekend_multiplier, peak_multiplier)
VALUES
('standard', 'Phòng Standard', 'Standard Room', 'スタンダードルーム', '标准间',
 'Phòng tiêu chuẩn thoải mái với đầy đủ tiện nghi, tầm nhìn thành phố.',
 'Comfortable standard room with full amenities and city view.',
 '快適なスタンダードルーム、市街の眺め。', '舒适的标准间，配有完整设施和城市景观。',
 800000, 2, 25, ARRAY['wifi','ac','tv','minibar','safe'], 1.3, 1.5),
('deluxe', 'Phòng Deluxe', 'Deluxe Room', 'デラックスルーム', '豪华间',
 'Phòng sang trọng với ban công riêng, tầm nhìn biển tuyệt đẹp.',
 'Luxurious room with private balcony and stunning ocean view.',
 '専用バルコニー付きの豪華な客室、海の絶景。', '豪华客房，配有私人阳台和壮丽海景。',
 1800000, 2, 35, ARRAY['wifi','ac','tv','minibar','safe','balcony','bathtub','ocean_view'], 1.3, 1.6),
('suite', 'Phòng Suite', 'Suite Room', 'スイートルーム', '套房',
 'Suite cao cấp với phòng khách riêng, bồn tắm jacuzzi và dịch vụ VIP.',
 'Premium suite with separate living room, jacuzzi and VIP service.',
 'リビング、ジャグジー付きプレミアムスイート、VIPサービス。', '高级套房，配有独立客厅、按摩浴缸和VIP服务。',
 3500000, 4, 60, ARRAY['wifi','ac','tv','minibar','safe','balcony','bathtub','ocean_view','jacuzzi','living_room'], 1.2, 1.5),
('family', 'Phòng Family', 'Family Room', 'ファミリールーム', '家庭房',
 'Phòng rộng rãi dành cho gia đình, 2 giường, không gian vui chơi cho trẻ.',
 'Spacious family room with 2 beds and kids play area.',
 '2ベッド、キッズエリア付きの広々ファミリールーム。', '宽敞的家庭房，配有2张床和儿童游乐区。',
 2000000, 4, 45, ARRAY['wifi','ac','tv','minibar','safe','balcony','kids_area','extra_bed'], 1.3, 1.5);
