CREATE TABLE public.promo_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_vi text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  badge_vi text NOT NULL DEFAULT 'ƯU ĐÃI HÈ 2026',
  badge_en text NOT NULL DEFAULT 'SUMMER 2026',
  bullets_vi jsonb NOT NULL DEFAULT '[]'::jsonb,
  bullets_en jsonb NOT NULL DEFAULT '[]'::jsonb,
  image_url text,
  cta_label_vi text NOT NULL DEFAULT 'Xem chi tiết →',
  cta_label_en text NOT NULL DEFAULT 'View details →',
  cta_link text NOT NULL DEFAULT '/khuyen-mai',
  sort_order integer NOT NULL DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active banners"
  ON public.promo_banners FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "Admins can manage banners"
  ON public.promo_banners FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_promo_banners_updated_at
  BEFORE UPDATE ON public.promo_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.promo_banners (title_vi, title_en, badge_vi, badge_en, bullets_vi, bullets_en, image_url, cta_link, sort_order)
VALUES (
  'Ở CÀNG NHIỀU — ƯU ĐÃI CÀNG CAO',
  'STAY MORE — SAVE MORE',
  'ƯU ĐÃI HÈ 2026',
  'SUMMER 2026',
  '["Đặt trực tiếp: rẻ hơn Booking & Agoda","2 đêm: Miễn phí bữa sáng cho 2 khách","Đặt sớm 30 ngày: Giảm thêm 10% giá phòng","Khách thành viên VIP: Ưu tiên phòng đẹp"]'::jsonb,
  '["Book direct: cheaper than Booking & Agoda","2 nights: Free breakfast for 2 guests","Book 30 days early: Extra 10% off","VIP members: Priority best rooms"]'::jsonb,
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=85',
  '/khuyen-mai',
  0
);