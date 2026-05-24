ALTER TABLE public.manual_invoices
  ADD COLUMN IF NOT EXISTS room_lines JSONB,
  ADD COLUMN IF NOT EXISTS email_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pending_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ;