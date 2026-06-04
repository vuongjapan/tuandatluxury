
-- 1. Explicit admin-only SELECT policies for clarity/auditability
CREATE POLICY "Admins read chatbot_sessions"
  ON public.chatbot_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- pool_orders, pool_special_requests, restaurant_reservations already have admin ALL policies
-- which cover SELECT, but add explicit SELECT policies for auditability
CREATE POLICY "Admins read pool_orders"
  ON public.pool_orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins read pool_special_requests"
  ON public.pool_special_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins read restaurant_reservations"
  ON public.restaurant_reservations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Replace email-based SELECT policy on user_bookings_count with user_id match
DROP POLICY IF EXISTS "Owner or admin reads user_bookings_count" ON public.user_bookings_count;

CREATE POLICY "Owner or admin reads user_bookings_count"
  ON public.user_bookings_count FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );
