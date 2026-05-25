
-- 1. BOOKINGS
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.bookings', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Owner or admin can read bookings"
  ON public.bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin')
         OR (user_id IS NOT NULL AND user_id = auth.uid()));

-- 2. BOOKING_COMBOS / BOOKING_FOOD_ITEMS
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='booking_combos' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.booking_combos', p.policyname);
  END LOOP;
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='booking_food_items' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.booking_food_items', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Owner or admin can read booking_combos"
  ON public.booking_combos FOR SELECT
  USING (public.has_role(auth.uid(), 'admin')
         OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_combos.booking_id AND b.user_id = auth.uid()));
CREATE POLICY "Owner or admin can read booking_food_items"
  ON public.booking_food_items FOR SELECT
  USING (public.has_role(auth.uid(), 'admin')
         OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_food_items.booking_id AND b.user_id = auth.uid()));

-- 3. INVOICES
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='invoices' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.invoices', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Owner or admin can read invoices"
  ON public.invoices FOR SELECT
  USING (public.has_role(auth.uid(), 'admin')
         OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = invoices.booking_id AND b.user_id = auth.uid()));

-- 4. MANUAL_INVOICES + ITEMS (admin only)
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='manual_invoices' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.manual_invoices', p.policyname);
  END LOOP;
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='manual_invoice_items' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.manual_invoice_items', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Admins read manual_invoices" ON public.manual_invoices FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read manual_invoice_items" ON public.manual_invoice_items FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- 5. FOOD_ORDERS / FOOD_ORDER_ITEMS (admin only; guests use RPC)
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='food_orders' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.food_orders', p.policyname);
  END LOOP;
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='food_order_items' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.food_order_items', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Admins read food_orders" ON public.food_orders FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read food_order_items" ON public.food_order_items FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- 6. SERVICE_BOOKINGS (owner or admin) and TRANSPORT_BOOKINGS (admin only; guests use RPC)
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='service_bookings' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.service_bookings', p.policyname);
  END LOOP;
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='transport_bookings' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.transport_bookings', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Owner or admin reads service_bookings"
  ON public.service_bookings FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR (user_id IS NOT NULL AND user_id = auth.uid()));
CREATE POLICY "Admins read transport_bookings"
  ON public.transport_bookings FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- 7. VOUCHER_CODES (admin only; guests use validate RPC)
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='voucher_codes' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.voucher_codes', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Admins read voucher_codes" ON public.voucher_codes FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- 8. SECURITY DEFINER lookup RPCs

CREATE OR REPLACE FUNCTION public.lookup_booking_by_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'booking', to_jsonb(b),
    'room_name_vi', r.name_vi,
    'room_name_en', r.name_en,
    'combos', COALESCE((SELECT jsonb_agg(to_jsonb(bc)) FROM public.booking_combos bc WHERE bc.booking_id = b.id), '[]'::jsonb),
    'food_items', COALESCE((SELECT jsonb_agg(to_jsonb(bf)) FROM public.booking_food_items bf WHERE bf.booking_id = b.id), '[]'::jsonb)
  ) INTO result
  FROM public.bookings b
  LEFT JOIN public.rooms r ON r.id = b.room_id
  WHERE b.booking_code = upper(trim(p_code))
  LIMIT 1;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.lookup_food_order_by_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'order', to_jsonb(fo),
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', foi.id,
        'quantity', foi.quantity,
        'price_vnd', foi.price_vnd,
        'menu_items', jsonb_build_object('name_vi', mi.name_vi, 'name_en', mi.name_en, 'category', mi.category)
      ))
      FROM public.food_order_items foi
      LEFT JOIN public.menu_items mi ON mi.id = foi.menu_item_id
      WHERE foi.food_order_id = fo.id
    ), '[]'::jsonb)
  ) INTO result
  FROM public.food_orders fo
  WHERE fo.food_order_id = upper(trim(p_code))
  LIMIT 1;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.lookup_manual_invoice_by_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'invoice', to_jsonb(m),
    'items', COALESCE((SELECT jsonb_agg(to_jsonb(mi) ORDER BY mi.sort_order) FROM public.manual_invoice_items mi WHERE mi.invoice_id = m.id), '[]'::jsonb)
  ) INTO result
  FROM public.manual_invoices m
  WHERE m.invoice_code = upper(trim(p_code))
  LIMIT 1;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.lookup_orders_by_contact(p_phone text, p_email text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_phone text := nullif(trim(coalesce(p_phone,'')),'');
        v_email text := lower(nullif(trim(coalesce(p_email,'')),''));
        v_b jsonb; v_f jsonb; v_m jsonb;
BEGIN
  IF v_phone IS NULL AND v_email IS NULL THEN
    RETURN jsonb_build_object('bookings','[]'::jsonb,'food_orders','[]'::jsonb,'manual_invoices','[]'::jsonb);
  END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_b FROM (
    SELECT * FROM public.bookings
    WHERE visibility='visible'
      AND ((v_phone IS NOT NULL AND guest_phone=v_phone) OR (v_email IS NOT NULL AND lower(guest_email)=v_email))
    ORDER BY created_at DESC LIMIT 30
  ) t;
  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_f FROM (
    SELECT * FROM public.food_orders
    WHERE ((v_phone IS NOT NULL AND phone=v_phone) OR (v_email IS NOT NULL AND lower(guest_email)=v_email))
    ORDER BY created_at DESC LIMIT 30
  ) t;
  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_m FROM (
    SELECT * FROM public.manual_invoices
    WHERE ((v_phone IS NOT NULL AND guest_phone=v_phone) OR (v_email IS NOT NULL AND lower(guest_email)=v_email))
    ORDER BY created_at DESC LIMIT 30
  ) t;
  RETURN jsonb_build_object('bookings', v_b, 'food_orders', v_f, 'manual_invoices', v_m);
END $$;

CREATE OR REPLACE FUNCTION public.validate_voucher_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v record;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN RETURN NULL; END IF;
  SELECT * INTO v FROM public.voucher_codes WHERE code = upper(trim(p_code)) LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'id', v.id, 'code', v.code, 'campaign_name', v.campaign_name,
    'discount_type', v.discount_type, 'discount_value', v.discount_value,
    'applies_to', v.applies_to, 'usage_limit', v.usage_limit,
    'used_count', v.used_count, 'start_date', v.start_date,
    'end_date', v.end_date, 'status', v.status
  );
END $$;

CREATE OR REPLACE FUNCTION public.get_my_member_vouchers()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN '[]'::jsonb; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', mv.id, 'voucher_code', mv.voucher_code, 'used_at', mv.used_at, 'assigned_at', mv.assigned_at,
      'voucher', jsonb_build_object(
        'code', vc.code, 'discount_type', vc.discount_type, 'discount_value', vc.discount_value,
        'end_date', vc.end_date, 'campaign_name', vc.campaign_name
      )
    ) ORDER BY mv.assigned_at DESC)
    FROM public.member_vouchers mv
    LEFT JOIN public.voucher_codes vc ON vc.code = mv.voucher_code
    WHERE mv.user_id = uid AND mv.is_visible = true
  ), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.next_transport_count_today()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::int FROM public.transport_bookings WHERE created_at >= date_trunc('day', now());
$$;

CREATE OR REPLACE FUNCTION public.count_food_orders_for_base(p_base text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::int FROM public.food_orders WHERE food_order_id ILIKE (p_base || 'FOOD%');
$$;

GRANT EXECUTE ON FUNCTION public.lookup_booking_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_food_order_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_manual_invoice_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_orders_by_contact(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_voucher_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_member_vouchers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_transport_count_today() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_food_orders_for_base(text) TO anon, authenticated;

-- 9. Realtime: drop bookings (polling fallback exists)
ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings;
