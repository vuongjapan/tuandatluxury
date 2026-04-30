-- Add visibility controls to bookings (admin can hide from guest searches)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS hidden_reason text,
  ADD COLUMN IF NOT EXISTS hidden_by uuid,
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_bookings_visibility ON public.bookings(visibility);

-- Public storage bucket for member avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars: anyone can read, authenticated users manage their own folder
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Avatars are publicly readable') THEN
    CREATE POLICY "Avatars are publicly readable" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users upload own avatar') THEN
    CREATE POLICY "Users upload own avatar" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users update own avatar') THEN
    CREATE POLICY "Users update own avatar" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users delete own avatar') THEN
    CREATE POLICY "Users delete own avatar" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;