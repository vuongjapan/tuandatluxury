
-- Services table for amenities and shuttle services
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_vi TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  description_vi TEXT,
  description_en TEXT,
  icon TEXT NOT NULL DEFAULT '🏨',
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'amenity',
  is_bookable BOOLEAN NOT NULL DEFAULT false,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price_vnd INTEGER NOT NULL DEFAULT 0,
  schedule TEXT,
  vehicle_types JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Service bookings table
CREATE TABLE public.service_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id),
  user_id UUID,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  booking_date DATE NOT NULL,
  booking_time TEXT,
  guests_count INTEGER NOT NULL DEFAULT 1,
  pickup_location TEXT,
  vehicle_type TEXT,
  original_price_vnd INTEGER NOT NULL DEFAULT 0,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  total_price_vnd INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'at_hotel',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert service bookings" ON public.service_bookings
  FOR INSERT WITH CHECK (guest_name IS NOT NULL AND guest_phone IS NOT NULL);

CREATE POLICY "Users can view own service bookings" ON public.service_bookings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage service bookings" ON public.service_bookings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_service_bookings_updated_at
  BEFORE UPDATE ON public.service_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed amenity services
INSERT INTO public.services (name_vi, name_en, description_vi, description_en, icon, category, is_bookable, is_free, sort_order) VALUES
('Hồ bơi vô cực', 'Infinity Pool', 'Hồ bơi vô cực ngoài trời, mở quanh năm, miễn phí cho khách lưu trú', 'Outdoor infinity pool, open year-round, free for guests', '🏊', 'amenity', false, true, 1),
('Nhà hàng', 'Restaurants', '2 nhà hàng trong khuôn viên, phục vụ buffet sáng và gọi món', '2 on-site restaurants serving breakfast buffet and à la carte', '🍽️', 'amenity', false, true, 2),
('WiFi miễn phí', 'Free WiFi', 'WiFi miễn phí toàn khu vực khách sạn', 'Free WiFi throughout the hotel', '📶', 'amenity', false, true, 3),
('Chỗ đỗ xe', 'Parking', 'Chỗ đỗ xe riêng miễn phí', 'Free private parking', '🅿️', 'amenity', false, true, 4),
('Phòng gia đình', 'Family Rooms', 'Phòng gia đình, phòng không hút thuốc', 'Family rooms, non-smoking rooms', '👨‍👩‍👧‍👦', 'amenity', false, true, 5),
('Dịch vụ phòng 24/7', 'Room Service 24/7', 'Dịch vụ phòng, lễ tân 24/7', '24/7 room service and reception', '🛎️', 'amenity', false, true, 6),
('Giáp biển', 'Beachfront', 'Giáp biển, khu vực thư giãn ngoài trời', 'Beachfront with outdoor relaxation area', '🏖️', 'amenity', false, true, 7);

-- Seed shuttle services
INSERT INTO public.services (name_vi, name_en, description_vi, description_en, icon, category, is_bookable, is_free, schedule, sort_order) VALUES
('Đưa đón tắm biển', 'Beach Shuttle', 'Miễn phí cho khách lưu trú', 'Free for hotel guests', '🏖️', 'shuttle', true, true, '7:00 - 11:00, 14:00 - 17:00', 10);

INSERT INTO public.services (name_vi, name_en, description_vi, description_en, icon, category, is_bookable, is_free, schedule, sort_order) VALUES
('Đưa đón quảng trường biển', 'Beach Square Shuttle', 'Miễn phí, đặt chỗ theo thời gian', 'Free, book by time slot', '🌊', 'shuttle', true, true, '18:00 - 22:00', 11);

INSERT INTO public.services (name_vi, name_en, description_vi, description_en, icon, category, is_bookable, is_free, price_vnd, vehicle_types, sort_order) VALUES
('Đưa đón sân bay / theo yêu cầu', 'Airport / Custom Shuttle', 'Giá theo loại xe, số khách và hành lý', 'Price varies by vehicle type, passengers and luggage', '✈️', 'shuttle', true, false, 500000,
 '[{"type":"Xe 4 chỗ","type_en":"4-seat car","capacity":3,"luggage":2,"price":500000},{"type":"Xe 7 chỗ","type_en":"7-seat car","capacity":6,"luggage":4,"price":800000},{"type":"Xe 16 chỗ","type_en":"16-seat van","capacity":12,"luggage":8,"price":1200000}]'::jsonb,
 12);
