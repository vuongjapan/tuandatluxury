
-- Create sequence for sequential booking codes
CREATE SEQUENCE IF NOT EXISTS public.booking_code_seq START WITH 1;

-- Update default for booking_code to use TDLH-XXXXX format
ALTER TABLE public.bookings ALTER COLUMN booking_code SET DEFAULT 'TDLH-' || LPAD(nextval('public.booking_code_seq')::text, 5, '0');

-- Update invoice_number to use sequential format too
CREATE SEQUENCE IF NOT EXISTS public.invoice_code_seq START WITH 1;

ALTER TABLE public.invoices ALTER COLUMN invoice_number SET DEFAULT 'TDLH-' || LPAD(nextval('public.invoice_code_seq')::text, 5, '0');
