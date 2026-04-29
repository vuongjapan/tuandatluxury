
-- 1) Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS id_card text,
  ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'Việt Nam',
  ADD COLUMN IF NOT EXISTS room_preferences text,
  ADD COLUMN IF NOT EXISTS special_requests text,
  ADD COLUMN IF NOT EXISTS admin_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS manual_tier text,
  ADD COLUMN IF NOT EXISTS manual_tier_note text;

-- Profile RLS: ensure self + admin
DO $$ BEGIN
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;
CREATE POLICY "Admins delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Bookings.user_id
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON public.bookings(guest_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON public.bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- 3) member_messages table
CREATE TABLE IF NOT EXISTS public.member_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sender text NOT NULL CHECK (sender IN ('member','admin')),
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_messages_user ON public.member_messages(user_id, created_at DESC);

ALTER TABLE public.member_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view own messages" ON public.member_messages;
CREATE POLICY "Members view own messages" ON public.member_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Members send own messages" ON public.member_messages;
CREATE POLICY "Members send own messages" ON public.member_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_id AND sender = 'member')
    OR (public.has_role(auth.uid(), 'admin') AND sender = 'admin')
  );

DROP POLICY IF EXISTS "Members update own messages read" ON public.member_messages;
CREATE POLICY "Members update own messages read" ON public.member_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete messages" ON public.member_messages;
CREATE POLICY "Admins delete messages" ON public.member_messages
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) Realtime
ALTER TABLE public.member_messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='member_messages';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.member_messages';
  END IF;
END $$;

-- 5) Sync function: link existing bookings to a user by phone OR email
CREATE OR REPLACE FUNCTION public.sync_user_bookings(_user_id uuid, _phone text, _email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer := 0;
BEGIN
  IF _user_id IS NULL THEN RETURN 0; END IF;

  WITH upd AS (
    UPDATE public.bookings b
    SET user_id = _user_id
    WHERE b.user_id IS NULL
      AND (
        (_phone IS NOT NULL AND length(trim(_phone)) > 0 AND b.guest_phone = _phone)
        OR (_email IS NOT NULL AND length(trim(_email)) > 0 AND lower(b.guest_email) = lower(_email))
      )
    RETURNING 1
  )
  SELECT count(*) INTO affected FROM upd;

  RETURN affected;
END;
$$;
