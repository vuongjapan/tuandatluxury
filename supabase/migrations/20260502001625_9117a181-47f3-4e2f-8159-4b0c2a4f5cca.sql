
-- Add manual deposit confirmation tracking columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS deposit_paid_amount integer,
  ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS deposit_manually_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_auto_detected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_email_sent_at timestamptz;

-- Enable realtime so /invoice/{code} updates instantly when admin confirms
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
