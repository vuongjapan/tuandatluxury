-- Manual invoices created by admin
CREATE TABLE public.manual_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_code TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  guest_email TEXT,
  check_in DATE,
  check_out DATE,
  guests_count INTEGER NOT NULL DEFAULT 2,
  children_count INTEGER NOT NULL DEFAULT 0,
  room_id TEXT,
  room_name TEXT,
  room_quantity INTEGER NOT NULL DEFAULT 1,
  nights INTEGER NOT NULL DEFAULT 1,
  room_price_per_night INTEGER NOT NULL DEFAULT 0,
  room_subtotal INTEGER NOT NULL DEFAULT 0,
  food_subtotal INTEGER NOT NULL DEFAULT 0,
  custom_subtotal INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  discount_note TEXT,
  total_amount INTEGER NOT NULL DEFAULT 0,
  deposit_amount INTEGER NOT NULL DEFAULT 0,
  remaining_amount INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  email_sent_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.manual_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.manual_invoices(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'food', -- 'food' | 'combo' | 'custom' | 'service'
  ref_id TEXT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_manual_invoice_items_invoice ON public.manual_invoice_items(invoice_id);
CREATE INDEX idx_manual_invoices_created ON public.manual_invoices(created_at DESC);

ALTER TABLE public.manual_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage manual invoices"
  ON public.manual_invoices FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public view manual invoices by code"
  ON public.manual_invoices FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage manual invoice items"
  ON public.manual_invoice_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public view manual invoice items"
  ON public.manual_invoice_items FOR SELECT TO anon, authenticated
  USING (true);

CREATE TRIGGER trg_manual_invoices_updated
  BEFORE UPDATE ON public.manual_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();