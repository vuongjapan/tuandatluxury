
-- Add deposit fields to bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS deposit_amount integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'PENDING';

-- Add deposit fields to invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS deposit_amount integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'PENDING';

-- Webhook logs table for idempotency
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'sepay',
  transaction_id text,
  description text,
  amount integer NOT NULL DEFAULT 0,
  matched_booking_code text,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhook logs" ON public.webhook_logs
FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow edge functions (anon) to insert webhook logs
CREATE POLICY "Service can insert webhook logs" ON public.webhook_logs
FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Service can select webhook logs" ON public.webhook_logs
FOR SELECT TO anon USING (true);
