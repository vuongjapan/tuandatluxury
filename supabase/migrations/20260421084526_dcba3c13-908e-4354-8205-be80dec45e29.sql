-- Create mandatory_combo_dates table
CREATE TABLE public.mandatory_combo_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  label TEXT NOT NULL,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mandatory_combo_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active mandatory dates"
ON public.mandatory_combo_dates
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage mandatory dates"
ON public.mandatory_combo_dates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_mandatory_combo_dates_updated_at
BEFORE UPDATE ON public.mandatory_combo_dates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Seed default holiday
INSERT INTO public.mandatory_combo_dates (date_from, date_to, label, note, is_active)
VALUES (
  '2026-04-25',
  '2026-05-02',
  'Lễ 30/4 – 1/5 2026',
  'Trong dịp lễ 30/4 – 1/5, khách lưu trú bắt buộc đặt combo ăn uống theo quy định của khách sạn.',
  true
);