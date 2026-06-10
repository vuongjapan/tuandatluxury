
-- 1) Remove auction_bids from Realtime publication to prevent broadcasting bidder phone/name
ALTER PUBLICATION supabase_realtime DROP TABLE public.auction_bids;

-- 2) Tighten realtime.messages subscribe policy: only own member chat topic or admin
DROP POLICY IF EXISTS "member_chat_own_subscribe" ON realtime.messages;
CREATE POLICY "member_chat_own_subscribe"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('member_chat_' || (auth.uid())::text)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 3) Lock down user_roles: only admins can insert/update/delete
DROP POLICY IF EXISTS "Admins manage roles insert" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles update" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles delete" ON public.user_roles;

CREATE POLICY "Admins manage roles insert"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage roles update"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage roles delete"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
