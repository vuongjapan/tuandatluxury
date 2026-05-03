
-- Bảng sessions chatbot
CREATE TABLE IF NOT EXISTS public.chatbot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text UNIQUE NOT NULL,

  guest_name text,
  guest_phone text,
  guest_email text,
  member_id uuid,

  entry_page text,
  device_type text,
  user_agent text,

  outcome text DEFAULT 'no_action',
  booking_id text,
  booking_code text,
  email_sent_to text,

  used_voice boolean DEFAULT false,
  voice_messages_count int DEFAULT 0,

  message_count int DEFAULT 0,
  duration_minutes int,

  -- Thông tin booking đã extract từ AI
  extracted_info jsonb DEFAULT '{}'::jsonb,

  -- Tag/note admin
  admin_tag text,
  admin_note text,

  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  last_activity timestamptz DEFAULT now()
);

ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert chatbot sessions"
  ON public.chatbot_sessions FOR INSERT TO anon, authenticated
  WITH CHECK (session_key IS NOT NULL);

CREATE POLICY "Public can update own chatbot session"
  ON public.chatbot_sessions FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Public can read chatbot sessions"
  ON public.chatbot_sessions FOR SELECT TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_chatbot_sess_phone ON public.chatbot_sessions(guest_phone);
CREATE INDEX IF NOT EXISTS idx_chatbot_sess_email ON public.chatbot_sessions(guest_email);
CREATE INDEX IF NOT EXISTS idx_chatbot_sess_started ON public.chatbot_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_sess_outcome ON public.chatbot_sessions(outcome);

-- Bổ sung cột vào chat_messages (đã tồn tại)
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS is_voice_input boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_voice_output boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_admin_message boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tokens_used int,
  ADD COLUMN IF NOT EXISTS response_time_ms int;

-- Cho phép role 'admin' (để admin chat thay khách)
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_role_check;
ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_role_check
  CHECK (role IN ('user','assistant','admin'));

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id, created_at);

-- Trigger update last_activity & message_count
CREATE OR REPLACE FUNCTION public.bump_chatbot_session_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.chatbot_sessions
  SET last_activity = now(),
      message_count = message_count + 1,
      voice_messages_count = voice_messages_count + (CASE WHEN NEW.is_voice_input OR NEW.is_voice_output THEN 1 ELSE 0 END),
      used_voice = used_voice OR NEW.is_voice_input OR NEW.is_voice_output
  WHERE session_key = NEW.session_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_chatbot_session ON public.chat_messages;
CREATE TRIGGER trg_bump_chatbot_session
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_chatbot_session_on_message();
