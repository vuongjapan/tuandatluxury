ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS sepay_bank text,
ADD COLUMN IF NOT EXISTS sepay_qr_url text;