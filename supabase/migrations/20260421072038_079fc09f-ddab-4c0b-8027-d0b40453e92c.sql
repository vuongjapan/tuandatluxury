-- 1) Drop old services table
DROP TABLE IF EXISTS public.services CASCADE;

-- 2) Create new services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  description TEXT,
  badge_text TEXT,
  badge_color TEXT DEFAULT 'gold',
  image_url TEXT,
  image_effect TEXT NOT NULL DEFAULT 'zoom',
  button_text TEXT,
  button_link TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active services"
  ON public.services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_services_sort ON public.services(sort_order);

-- 3) Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('service-images', 'service-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

CREATE POLICY "Public can view service images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-images');

CREATE POLICY "Admins can upload service images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'service-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update service images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'service-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete service images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'service-images' AND has_role(auth.uid(), 'admin'::app_role));

-- 4) Seed 5 default services
INSERT INTO public.services (sort_order, name, description, badge_text, badge_color, image_url, image_effect, button_text, button_link, is_featured, is_active) VALUES
(1, 'Hồ Bơi Vô Cực', 'Bể bơi tầng 6, view FLC toàn cảnh. Mở cửa 06:00–22:00. Miễn phí cho khách lưu trú.', 'Miễn phí', 'gold', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80', 'zoom', 'Khám phá →', '/dich-vu', true, true),
(2, 'Nhà Hàng Hải Sản', '2 tầng phục vụ, 120+ món hải sản tươi. Mở cửa 07:00–21:30.', 'Miễn phí', 'gold', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80', 'fade', 'Xem thực đơn →', '/am-thuc', true, true),
(3, 'Đưa Đón Sân Bay', 'Dịch vụ đưa đón tận nơi từ sân bay Thọ Xuân về khách sạn và ngược lại. Đặt trước qua lễ tân hoặc Zalo.', 'Theo yêu cầu', 'navy', 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80', 'slide', 'Đặt dịch vụ →', 'tel:0983605768', true, true),
(4, 'Đưa Đón Bãi Tắm FLC', 'Xe điện miễn phí đưa đón khách ra bãi biển FLC Sầm Sơn. Khởi hành mỗi 30 phút từ 06:00–20:00.', 'Miễn phí', 'gold', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', 'parallax', 'Xem lịch xe →', '/dich-vu', true, true),
(5, 'Đưa Đón Quảng Trường', 'Đưa đón đến Quảng Trường Biển FLC — trung tâm vui chơi, mua sắm và ẩm thực sầm uất nhất khu vực. Cách khách sạn ~5 phút.', 'Miễn phí', 'gold', 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80', 'fade', 'Tìm hiểu thêm →', '/dich-vu', true, true);

-- 5) Seed intro section site_settings keys
INSERT INTO public.site_settings (key, value) VALUES
  ('intro_title', 'Kỳ Nghỉ Ngập Tràn Niềm Vui'),
  ('intro_description', 'Tọa lạc ngay trong khu nghỉ dưỡng FLC Sầm Sơn 5 sao — khu nghỉ dưỡng biển đầu tiên miền Bắc và Bắc Trung Bộ — Khách sạn Tuấn Đạt Luxury mang đến trải nghiệm sang trọng chỉ cách bãi biển 50m. Với 19 phòng thiết kế hiện đại, hồ bơi vô cực tầng thượng view biển, nhà hàng hải sản 2 tầng và đội ngũ phục vụ tận tâm 24/7, chúng tôi cam kết mỗi kỳ nghỉ của quý khách sẽ là những kỷ niệm đáng nhớ nhất.'),
  ('intro_photo_1_url', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80'),
  ('intro_photo_1_caption', 'Hồ bơi vô cực — Tầng 6 · View biển FLC'),
  ('intro_photo_2_url', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'),
  ('intro_photo_2_caption', 'Nhà hàng hải sản — 2 tầng · 120+ món đặc sản'),
  ('intro_photo_3_url', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80'),
  ('intro_photo_3_caption', 'Phòng nghỉ sang trọng — 19 phòng · Check-in 14:00')
ON CONFLICT (key) DO NOTHING;