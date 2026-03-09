
-- Fix ALL RLS policies: change from RESTRICTIVE to PERMISSIVE
-- This is the root cause of blank pages - restrictive policies require ALL to pass,
-- so the admin-only ALL policy blocks public SELECT access.

-- ============ rooms ============
DROP POLICY IF EXISTS "Admins can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Public can read active rooms" ON public.rooms;
CREATE POLICY "Admins can manage rooms" ON public.rooms FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can read active rooms" ON public.rooms FOR SELECT TO anon, authenticated USING (is_active = true);

-- ============ dining_categories ============
DROP POLICY IF EXISTS "Admins can manage dining categories" ON public.dining_categories;
DROP POLICY IF EXISTS "Public can view active dining categories" ON public.dining_categories;
CREATE POLICY "Admins can manage dining categories" ON public.dining_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can view active dining categories" ON public.dining_categories FOR SELECT TO anon, authenticated USING (is_active = true);

-- ============ dining_items ============
DROP POLICY IF EXISTS "Admins can manage dining items" ON public.dining_items;
DROP POLICY IF EXISTS "Public can view active dining items" ON public.dining_items;
CREATE POLICY "Admins can manage dining items" ON public.dining_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can view active dining items" ON public.dining_items FOR SELECT TO anon, authenticated USING (is_active = true);

-- ============ gallery_images ============
DROP POLICY IF EXISTS "Admins can manage gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Public can view active gallery images" ON public.gallery_images;
CREATE POLICY "Admins can manage gallery images" ON public.gallery_images FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can view active gallery images" ON public.gallery_images FOR SELECT TO anon, authenticated USING (is_active = true);

-- ============ promotions ============
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can view active promotions" ON public.promotions FOR SELECT TO anon, authenticated USING (is_active = true);

-- ============ services ============
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Admins can manage services" ON public.services FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can view active services" ON public.services FOR SELECT TO anon, authenticated USING (is_active = true);

-- ============ site_settings ============
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

-- ============ room_monthly_prices ============
DROP POLICY IF EXISTS "Admins can manage monthly prices" ON public.room_monthly_prices;
DROP POLICY IF EXISTS "Public can view monthly prices" ON public.room_monthly_prices;
CREATE POLICY "Admins can manage monthly prices" ON public.room_monthly_prices FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can view monthly prices" ON public.room_monthly_prices FOR SELECT TO anon, authenticated USING (true);

-- ============ room_daily_availability ============
DROP POLICY IF EXISTS "Admins can manage daily availability" ON public.room_daily_availability;
DROP POLICY IF EXISTS "Public can view daily availability" ON public.room_daily_availability;
CREATE POLICY "Admins can manage daily availability" ON public.room_daily_availability FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can view daily availability" ON public.room_daily_availability FOR SELECT TO anon, authenticated USING (true);

-- ============ room_price_overrides ============
DROP POLICY IF EXISTS "Admins can manage price overrides" ON public.room_price_overrides;
DROP POLICY IF EXISTS "Public can view price overrides" ON public.room_price_overrides;
CREATE POLICY "Admins can manage price overrides" ON public.room_price_overrides FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can view price overrides" ON public.room_price_overrides FOR SELECT TO anon, authenticated USING (true);

-- ============ bookings ============
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Guests can view own booking by code" ON public.bookings;
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Guests can view own booking by code" ON public.bookings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can insert bookings" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (guest_name IS NOT NULL AND guest_phone IS NOT NULL);

-- ============ invoices ============
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Public can view invoices" ON public.invoices;
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can view invoices" ON public.invoices FOR SELECT TO anon, authenticated USING (true);

-- ============ chat_messages ============
DROP POLICY IF EXISTS "Public can insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public can read chat messages" ON public.chat_messages;
CREATE POLICY "Public can read chat messages" ON public.chat_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can insert chat messages" ON public.chat_messages FOR INSERT TO anon, authenticated WITH CHECK (session_id IS NOT NULL AND role = ANY (ARRAY['user'::text, 'assistant'::text]) AND content IS NOT NULL);

-- ============ service_bookings ============
DROP POLICY IF EXISTS "Admins can manage service bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Public can insert service bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Users can view own service bookings" ON public.service_bookings;
CREATE POLICY "Admins can manage service bookings" ON public.service_bookings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can insert service bookings" ON public.service_bookings FOR INSERT TO anon, authenticated WITH CHECK (guest_name IS NOT NULL AND guest_phone IS NOT NULL);
CREATE POLICY "Users can view own service bookings" ON public.service_bookings FOR SELECT TO anon, authenticated USING (true);

-- ============ user_roles ============
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ profiles ============
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
