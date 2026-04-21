-- Add new columns
ALTER TABLE public.mandatory_combo_dates
  ADD COLUMN IF NOT EXISTS rule_type text NOT NULL DEFAULT 'date_range',
  ADD COLUMN IF NOT EXISTS weekdays jsonb,
  ADD COLUMN IF NOT EXISTS months jsonb,
  ADD COLUMN IF NOT EXISTS banner_title text,
  ADD COLUMN IF NOT EXISTS banner_message text;

-- Allow null date_from/date_to for weekday_month rules
ALTER TABLE public.mandatory_combo_dates
  ALTER COLUMN date_from DROP NOT NULL,
  ALTER COLUMN date_to DROP NOT NULL;

-- Add check constraint for rule_type values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mandatory_combo_dates_rule_type_check'
  ) THEN
    ALTER TABLE public.mandatory_combo_dates
      ADD CONSTRAINT mandatory_combo_dates_rule_type_check
      CHECK (rule_type IN ('date_range', 'weekday_month'));
  END IF;
END $$;

-- Insert default weekend summer rule if not present
INSERT INTO public.mandatory_combo_dates (
  label, note, rule_type, weekdays, months, is_active,
  banner_title, banner_message,
  date_from, date_to
)
SELECT
  'Cuối tuần tháng 6 & tháng 7',
  'Áp dụng các ngày Thứ 6, Thứ 7, Chủ Nhật trong tháng 6 và tháng 7 hằng năm',
  'weekday_month',
  '[5,6,0]'::jsonb,
  '[6,7]'::jsonb,
  true,
  'Cuối tuần mùa hè: Bắt buộc đặt combo ăn uống',
  'Vào các ngày Thứ 6, Thứ 7, Chủ Nhật trong tháng 6 và tháng 7, nhà hàng phục vụ theo hình thức combo do lượng khách đông. Quý khách cần chọn combo ăn uống để tiếp tục đặt phòng. Nhà hàng phục vụ từ 07:00 – 21:30.',
  NULL, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.mandatory_combo_dates WHERE rule_type = 'weekday_month'
);