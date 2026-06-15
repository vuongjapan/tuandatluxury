
GRANT SELECT (id, guest_name, rating, title, content, image_url, room_type, stay_date, is_approved, is_featured, sort_order, created_at, updated_at) ON public.reviews TO anon, authenticated;
GRANT INSERT (guest_name, guest_email, rating, title, content, image_url, room_type, stay_date) ON public.reviews TO anon, authenticated;
GRANT ALL ON public.reviews TO service_role;

DROP POLICY IF EXISTS "Anyone can insert tracking" ON public.visitor_tracking;
CREATE POLICY "Anyone can insert tracking"
  ON public.visitor_tracking FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    visitor_id IS NOT NULL
    AND length(visitor_id) BETWEEN 8 AND 128
    AND session_id IS NOT NULL
    AND length(session_id) BETWEEN 1 AND 128
    AND source_domain IS NOT NULL
    AND length(source_domain) BETWEEN 1 AND 255
    AND (user_agent IS NULL OR length(user_agent) <= 1000)
    AND (referrer IS NULL OR length(referrer) <= 1000)
    AND (country IS NULL OR length(country) <= 100)
    AND (country_code IS NULL OR length(country_code) <= 8)
    AND (city IS NULL OR length(city) <= 100)
  );

DROP POLICY IF EXISTS "Public can insert chatbot sessions" ON public.chatbot_sessions;
CREATE POLICY "Public can insert chatbot sessions"
  ON public.chatbot_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    session_key IS NOT NULL
    AND length(session_key) BETWEEN 4 AND 128
    AND guest_email IS NULL
    AND guest_phone IS NULL
    AND guest_name IS NULL
    AND extracted_info IS NULL
  );
