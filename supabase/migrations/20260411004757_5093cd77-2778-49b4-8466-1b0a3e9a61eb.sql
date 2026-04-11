
-- Add room management columns
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS total_rooms integer NOT NULL DEFAULT 1;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS bed_type text NOT NULL DEFAULT '';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS view_type text NOT NULL DEFAULT '';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS has_balcony boolean NOT NULL DEFAULT false;

-- Update standard room (4 phòng, 1 giường đôi, view thành phố)
UPDATE public.rooms SET
  name_vi = 'Phòng Đơn Deluxe Double',
  name_en = 'Deluxe Double Room',
  name_ja = 'デラックスダブルルーム',
  name_zh = '豪华双人房',
  total_rooms = 4,
  bed_type = '1 giường đôi lớn',
  view_type = 'View thành phố',
  has_balcony = false,
  capacity = 2,
  size_sqm = 30,
  is_active = true
WHERE id = 'standard';

-- Update deluxe room (8 phòng, 2 giường đôi, view thành phố)
UPDATE public.rooms SET
  name_vi = 'Phòng Đôi Deluxe Twin',
  name_en = 'Deluxe Twin Room',
  name_ja = 'デラックスツインルーム',
  name_zh = '豪华双床房',
  total_rooms = 8,
  bed_type = '2 giường đôi lớn',
  view_type = 'View thành phố',
  has_balcony = false,
  capacity = 4,
  size_sqm = 30,
  is_active = true
WHERE id = 'deluxe';

-- Update family/VIP room (7 phòng, 2 giường lớn, view biển, ban công)
UPDATE public.rooms SET
  name_vi = 'Phòng Đôi VIP',
  name_en = 'VIP Twin Room',
  name_ja = 'VIPツインルーム',
  name_zh = 'VIP双床房',
  description_vi = 'Phòng sang trọng với ban công riêng, tầm nhìn biển và thành phố tuyệt đẹp.',
  description_en = 'Luxurious room with private balcony and stunning ocean & city view.',
  total_rooms = 7,
  bed_type = '2 giường lớn',
  view_type = 'View biển + thành phố',
  has_balcony = true,
  capacity = 4,
  size_sqm = 35,
  is_active = true
WHERE id = 'family';

-- Deactivate unused rooms
UPDATE public.rooms SET is_active = false WHERE id IN ('suite') AND is_active = true;
