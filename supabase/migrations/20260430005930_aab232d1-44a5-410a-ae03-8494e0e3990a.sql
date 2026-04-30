
-- ===== Member vouchers (admin assigned only) =====
CREATE TABLE IF NOT EXISTS public.member_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  voucher_code text NOT NULL,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_note text,
  notified boolean NOT NULL DEFAULT false,
  notified_at timestamptz,
  is_visible boolean NOT NULL DEFAULT true,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_vouchers_user ON public.member_vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_member_vouchers_code ON public.member_vouchers(voucher_code);

ALTER TABLE public.member_vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read own vouchers" ON public.member_vouchers;
CREATE POLICY "Members read own vouchers"
  ON public.member_vouchers FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage member vouchers" ON public.member_vouchers;
CREATE POLICY "Admins manage member vouchers"
  ON public.member_vouchers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== Indexes for lookup performance =====
CREATE INDEX IF NOT EXISTS idx_bookings_visibility ON public.bookings(visibility);
CREATE INDEX IF NOT EXISTS idx_manual_invoices_code ON public.manual_invoices(invoice_code);
CREATE INDEX IF NOT EXISTS idx_manual_invoices_phone ON public.manual_invoices(guest_phone);
CREATE INDEX IF NOT EXISTS idx_manual_invoices_email ON public.manual_invoices(guest_email);

-- ===== Allow public/anon SELECT on manual_invoices for /tra-cuu lookup =====
-- Mirror visibility rule by exposing only specific columns? Keep simple: full row read OK
-- Existing RLS: check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='manual_invoices' AND policyname='Public can read manual invoices for lookup'
  ) THEN
    CREATE POLICY "Public can read manual invoices for lookup"
      ON public.manual_invoices FOR SELECT
      USING (true);
  END IF;
END $$;

-- ===== Storage policies for avatars bucket (member-managed) =====
-- Bucket 'avatars' already exists & public.
-- Ensure user-folder write policies exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Avatars: users upload own folder') THEN
    CREATE POLICY "Avatars: users upload own folder"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Avatars: users update own folder') THEN
    CREATE POLICY "Avatars: users update own folder"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Avatars: users delete own folder') THEN
    CREATE POLICY "Avatars: users delete own folder"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Avatars: public read') THEN
    CREATE POLICY "Avatars: public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END $$;
