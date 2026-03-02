
-- Create promotions table
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  description_vi TEXT,
  description_en TEXT,
  icon TEXT NOT NULL DEFAULT '🎁',
  image_url TEXT,
  benefits_vi TEXT[] NOT NULL DEFAULT '{}',
  benefits_en TEXT[] NOT NULL DEFAULT '{}',
  discount_percent INTEGER DEFAULT 0,
  applies_to_tier TEXT DEFAULT 'all',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Public can view active promotions
CREATE POLICY "Public can view active promotions"
ON public.promotions FOR SELECT
USING (is_active = true);

-- Admins can manage promotions
CREATE POLICY "Admins can manage promotions"
ON public.promotions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Seed default promotions
INSERT INTO public.promotions (title_vi, title_en, icon, benefits_vi, benefits_en, discount_percent, applies_to_tier, sort_order) VALUES
('Ưu đãi theo mùa', 'Seasonal Offers', '🌸', 
 ARRAY['Giảm 10–20% khi đặt sớm 7 ngày', 'Combo nghỉ dưỡng + ăn sáng', 'Ưu đãi lễ 30/4 – 1/5 – hè'],
 ARRAY['10-20% off for 7-day early booking', 'Resort + breakfast combo', 'Holiday specials'],
 15, 'all', 0),
('Ưu đãi thành viên', 'Member Benefits', '⭐',
 ARRAY['Thành viên thường: giảm 5%', 'VIP: giảm 10%', 'Siêu VIP: giảm 15% + ưu tiên phòng đẹp'],
 ARRAY['Member: 5% off', 'VIP: 10% off', 'Super VIP: 15% off + priority room'],
 0, 'member', 1),
('Ưu đãi cặp đôi / gia đình', 'Couple & Family', '💕',
 ARRAY['Trang trí phòng miễn phí', 'Tặng trái cây hoặc đồ uống', 'Check-out muộn'],
 ARRAY['Free room decoration', 'Complimentary fruits or drinks', 'Late check-out'],
 0, 'all', 2),
('Ưu đãi đoàn / công ty', 'Group & Corporate', '🏢',
 ARRAY['Giá phòng đặc biệt', 'Hỗ trợ xe đưa đón', 'Xuất hóa đơn nhanh'],
 ARRAY['Special room rates', 'Airport transfer support', 'Quick invoicing'],
 10, 'all', 3);
