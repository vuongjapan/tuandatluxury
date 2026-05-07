
CREATE TABLE public.competitor_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('hotel','restaurant','eatery')),
  name text NOT NULL,
  address text,
  area text,
  phone text,
  website text,
  star_rating int,
  room_prices jsonb DEFAULT '[]'::jsonb,
  amenities text[] DEFAULT '{}',
  cuisine_types text[] DEFAULT '{}',
  price_per_person_min int,
  price_per_person_max int,
  signature_dishes text,
  google_rating numeric(2,1),
  google_review_count int,
  admin_rating int,
  strengths text,
  weaknesses text,
  notes text,
  last_updated date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.competitor_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view competitor research"
  ON public.competitor_research FOR SELECT USING (true);

CREATE POLICY "Admins manage competitor research"
  ON public.competitor_research FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_competitor_research_updated_at
  BEFORE UPDATE ON public.competitor_research
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
