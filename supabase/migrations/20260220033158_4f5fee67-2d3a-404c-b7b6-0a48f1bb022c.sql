
-- Fix overly permissive INSERT policy on bookings (allow public insert but not WITH CHECK true on write)
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
CREATE POLICY "Public can insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    guest_name IS NOT NULL AND guest_phone IS NOT NULL
  );

-- Fix chat_messages - split into separate policies instead of ALL with true
DROP POLICY IF EXISTS "Public can insert/read chat messages" ON public.chat_messages;
CREATE POLICY "Public can read chat messages" ON public.chat_messages
  FOR SELECT USING (true);
CREATE POLICY "Public can insert chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    session_id IS NOT NULL AND role IN ('user', 'assistant') AND content IS NOT NULL
  );

-- Fix update_updated_at function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
