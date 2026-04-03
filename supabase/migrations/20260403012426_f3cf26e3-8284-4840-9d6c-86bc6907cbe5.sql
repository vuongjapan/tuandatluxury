-- Update booking_code default to new format TDLH2026AXXXXX
ALTER TABLE public.bookings 
ALTER COLUMN booking_code SET DEFAULT 'TDLH2026A' || lpad(nextval('booking_code_seq')::text, 5, '0');

-- Update invoice_number default to new format
ALTER TABLE public.invoices
ALTER COLUMN invoice_number SET DEFAULT 'TDLH2026A' || lpad(nextval('invoice_code_seq')::text, 5, '0');

-- Add room_quantity column
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_quantity integer NOT NULL DEFAULT 1;