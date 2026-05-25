
-- 1. Drop overly permissive public SELECT/UPDATE policies
DROP POLICY IF EXISTS "Public can view competitor research" ON public.competitor_research;
DROP POLICY IF EXISTS "Public can view active meal bypass codes" ON public.meal_bypass_codes;
DROP POLICY IF EXISTS "Public can view bids" ON public.auction_bids;
DROP POLICY IF EXISTS "Public can view own booking count" ON public.user_bookings_count;
DROP POLICY IF EXISTS "Public can read chatbot sessions" ON public.chatbot_sessions;
DROP POLICY IF EXISTS "Public can update own chatbot session" ON public.chatbot_sessions;

-- 2. Reviews: hide guest_email column from anon/authenticated
REVOKE SELECT (guest_email) ON public.reviews FROM anon, authenticated;

-- 3. Realtime channel authorization for member_messages
-- Only allow the owning user (or admin) to subscribe to their topic "member_chat_<uid>"
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='realtime' AND table_name='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "member_chat_own_subscribe" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "member_chat_own_subscribe"
      ON realtime.messages FOR SELECT
      TO authenticated
      USING (
        (realtime.topic() NOT LIKE 'member_chat_%')
        OR (realtime.topic() = 'member_chat_' || auth.uid()::text)
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      )
    $p$;
  END IF;
END $$;
