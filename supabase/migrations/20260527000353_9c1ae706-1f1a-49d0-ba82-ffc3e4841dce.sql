
-- 1) chat_messages: remove public SELECT
DROP POLICY IF EXISTS "Public can read chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can read chat messages" ON public.chat_messages;
CREATE POLICY "Admins can read chat messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) discount_codes: remove public SELECT
DROP POLICY IF EXISTS "Public can view active discount codes" ON public.discount_codes;

-- 3) reviews: revoke guest_email column from anon/authenticated
REVOKE SELECT (guest_email) ON public.reviews FROM anon, authenticated;
