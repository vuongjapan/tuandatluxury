
-- 1) competitor_research: admin-only SELECT
DROP POLICY IF EXISTS "Public read competitor_research" ON public.competitor_research;
DROP POLICY IF EXISTS "Anyone can view competitor_research" ON public.competitor_research;
DROP POLICY IF EXISTS "competitor_research_select" ON public.competitor_research;
DROP POLICY IF EXISTS "Public can view competitor_research" ON public.competitor_research;
CREATE POLICY "Admins read competitor_research"
  ON public.competitor_research FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) meal_bypass_codes: admin-only SELECT (validation goes through use_meal_bypass_code RPC)
DROP POLICY IF EXISTS "Public read active meal_bypass_codes" ON public.meal_bypass_codes;
DROP POLICY IF EXISTS "Public can view active meal_bypass_codes" ON public.meal_bypass_codes;
DROP POLICY IF EXISTS "Anyone can view active meal_bypass_codes" ON public.meal_bypass_codes;
DROP POLICY IF EXISTS "meal_bypass_codes_select" ON public.meal_bypass_codes;
CREATE POLICY "Admins read meal_bypass_codes"
  ON public.meal_bypass_codes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) auction_bids: admin-only SELECT (keep public INSERT for bidding)
DROP POLICY IF EXISTS "Public read auction_bids" ON public.auction_bids;
DROP POLICY IF EXISTS "Anyone can view auction_bids" ON public.auction_bids;
DROP POLICY IF EXISTS "Public can view auction_bids" ON public.auction_bids;
DROP POLICY IF EXISTS "auction_bids_select" ON public.auction_bids;
CREATE POLICY "Admins read auction_bids"
  ON public.auction_bids FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) user_bookings_count: admin or own-email
DROP POLICY IF EXISTS "Public read user_bookings_count" ON public.user_bookings_count;
DROP POLICY IF EXISTS "Anyone can view user_bookings_count" ON public.user_bookings_count;
DROP POLICY IF EXISTS "user_bookings_count_select" ON public.user_bookings_count;
CREATE POLICY "Owner or admin reads user_bookings_count"
  ON public.user_bookings_count FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (auth.jwt() ->> 'email') IS NOT NULL
       AND lower(email) = lower(auth.jwt() ->> 'email')
  );

-- 5) chatbot_sessions: remove public UPDATE; admins can update
DROP POLICY IF EXISTS "Public update chatbot_sessions" ON public.chatbot_sessions;
DROP POLICY IF EXISTS "Anyone can update chatbot_sessions" ON public.chatbot_sessions;
DROP POLICY IF EXISTS "chatbot_sessions_update" ON public.chatbot_sessions;
DROP POLICY IF EXISTS "Public can update chatbot_sessions" ON public.chatbot_sessions;
CREATE POLICY "Admins update chatbot_sessions"
  ON public.chatbot_sessions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6) reviews: hide guest_email column from public/auth roles
REVOKE SELECT (guest_email) ON public.reviews FROM anon, authenticated;

-- 7) Revoke EXECUTE on trigger-only / internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.set_promo_popups_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bump_chatbot_session_on_message() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recompute_user_tier() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_booking_count_on_confirm() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
-- keep has_role executable by authenticated (used by app code occasionally)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- keep use_meal_bypass_code and sync_user_bookings callable
GRANT EXECUTE ON FUNCTION public.use_meal_bypass_code(text, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_user_bookings(uuid, text, text) TO authenticated;
