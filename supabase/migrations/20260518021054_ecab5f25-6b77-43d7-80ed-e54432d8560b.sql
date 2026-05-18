
CREATE TABLE public.meal_bypass_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  valid_from date,
  valid_to date,
  max_uses integer NOT NULL DEFAULT 999,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_bypass_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage meal bypass codes"
  ON public.meal_bypass_codes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active meal bypass codes"
  ON public.meal_bypass_codes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER trg_meal_bypass_codes_updated_at
  BEFORE UPDATE ON public.meal_bypass_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Secure validate + increment RPC (callable by public)
CREATE OR REPLACE FUNCTION public.use_meal_bypass_code(p_code text, p_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.meal_bypass_codes%ROWTYPE;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN jsonb_build_object('valid', false, 'msg', 'Mã không hợp lệ!');
  END IF;

  SELECT * INTO rec
  FROM public.meal_bypass_codes
  WHERE upper(code) = upper(trim(p_code))
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'msg', 'Mã không hợp lệ!');
  END IF;

  IF rec.valid_from IS NOT NULL AND p_date < rec.valid_from THEN
    RETURN jsonb_build_object('valid', false, 'msg', 'Mã chưa có hiệu lực cho ngày này!');
  END IF;
  IF rec.valid_to IS NOT NULL AND p_date > rec.valid_to THEN
    RETURN jsonb_build_object('valid', false, 'msg', 'Mã đã hết hiệu lực cho ngày này!');
  END IF;
  IF rec.used_count >= rec.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'msg', 'Mã đã hết lượt dùng!');
  END IF;

  UPDATE public.meal_bypass_codes
    SET used_count = used_count + 1
    WHERE id = rec.id;

  RETURN jsonb_build_object('valid', true, 'msg', 'Mã hợp lệ!', 'code', rec.code);
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_meal_bypass_code(text, date) TO anon, authenticated;
