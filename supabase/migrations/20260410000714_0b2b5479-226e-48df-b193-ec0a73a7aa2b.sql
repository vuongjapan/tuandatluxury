
CREATE TABLE public.menu_item_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  label_vi text NOT NULL DEFAULT '',
  label_en text NOT NULL DEFAULT '',
  price_vnd integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_item_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active prices" ON public.menu_item_prices
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Admins can manage prices" ON public.menu_item_prices
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_menu_item_prices_item ON public.menu_item_prices(menu_item_id);
