CREATE TABLE public.personal_meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_count INTEGER NOT NULL CHECK (guest_count >= 1),
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active personal meal plans"
ON public.personal_meal_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage personal meal plans"
ON public.personal_meal_plans FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_personal_meal_plans_updated_at
BEFORE UPDATE ON public.personal_meal_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_personal_meal_plans_guest_count ON public.personal_meal_plans(guest_count, is_active, sort_order);