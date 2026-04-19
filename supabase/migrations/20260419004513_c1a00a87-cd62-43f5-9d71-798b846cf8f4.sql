-- ============ EXTERNAL HOTELS ============
CREATE TABLE public.external_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  area TEXT,
  zone TEXT,
  beach_zone TEXT,
  stars INTEGER DEFAULT 0,
  price_from INTEGER DEFAULT 0,
  price_to INTEGER DEFAULT 0,
  near_beach BOOLEAN DEFAULT false,
  pool BOOLEAN DEFAULT false,
  family_friendly BOOLEAN DEFAULT false,
  couple_friendly BOOLEAN DEFAULT false,
  group_friendly BOOLEAN DEFAULT false,
  luxury_level TEXT DEFAULT 'mid',
  parking BOOLEAN DEFAULT false,
  breakfast BOOLEAN DEFAULT false,
  description TEXT,
  map_link TEXT,
  phone TEXT,
  website TEXT,
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_ext_hotels_zone ON public.external_hotels(zone);
CREATE INDEX idx_ext_hotels_status ON public.external_hotels(status);
CREATE INDEX idx_ext_hotels_tags ON public.external_hotels USING GIN(tags);

ALTER TABLE public.external_hotels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active external hotels" ON public.external_hotels FOR SELECT USING (status = 'active');
CREATE POLICY "Admins manage external hotels" ON public.external_hotels FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ext_hotels_upd BEFORE UPDATE ON public.external_hotels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ RESTAURANTS ============
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  area TEXT,
  zone TEXT,
  avg_price INTEGER DEFAULT 0,
  price_tier TEXT DEFAULT 'mid',
  seafood BOOLEAN DEFAULT false,
  family_friendly BOOLEAN DEFAULT false,
  local_famous BOOLEAN DEFAULT false,
  specialties TEXT[] DEFAULT '{}',
  open_hours TEXT,
  map_link TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  status TEXT DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_rest_zone ON public.restaurants(zone);
CREATE INDEX idx_rest_tags ON public.restaurants USING GIN(tags);
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active restaurants" ON public.restaurants FOR SELECT USING (status = 'active');
CREATE POLICY "Admins manage restaurants" ON public.restaurants FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_rest_upd BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ CAFES ============
CREATE TABLE public.cafes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  area TEXT,
  zone TEXT,
  avg_price INTEGER DEFAULT 0,
  chill BOOLEAN DEFAULT false,
  sea_view BOOLEAN DEFAULT false,
  checkin BOOLEAN DEFAULT false,
  night_open BOOLEAN DEFAULT false,
  description TEXT,
  map_link TEXT,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  status TEXT DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_cafe_zone ON public.cafes(zone);
CREATE INDEX idx_cafe_tags ON public.cafes USING GIN(tags);
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active cafes" ON public.cafes FOR SELECT USING (status = 'active');
CREATE POLICY "Admins manage cafes" ON public.cafes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_cafe_upd BEFORE UPDATE ON public.cafes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ ATTRACTIONS ============
CREATE TABLE public.attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  area TEXT,
  zone TEXT,
  free_or_paid TEXT DEFAULT 'free',
  ticket_price INTEGER DEFAULT 0,
  best_time TEXT,
  family BOOLEAN DEFAULT false,
  nightlife BOOLEAN DEFAULT false,
  checkin BOOLEAN DEFAULT false,
  description TEXT,
  map_link TEXT,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  status TEXT DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_attr_zone ON public.attractions(zone);
CREATE INDEX idx_attr_tags ON public.attractions USING GIN(tags);
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active attractions ext" ON public.attractions FOR SELECT USING (status = 'active');
CREATE POLICY "Admins manage attractions ext" ON public.attractions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_attr_upd BEFORE UPDATE ON public.attractions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ ITINERARIES ============
CREATE TABLE public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT,
  budget_level TEXT,
  days INTEGER DEFAULT 2,
  audience TEXT,
  content_json JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active itineraries" ON public.itineraries FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage itineraries" ON public.itineraries FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_itin_upd BEFORE UPDATE ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ SEARCH LOGS ============
CREATE TABLE public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT,
  budget INTEGER,
  people_count INTEGER,
  zone TEXT,
  vibes TEXT[] DEFAULT '{}',
  result_count INTEGER DEFAULT 0,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_search_logs_created ON public.search_logs(created_at DESC);
CREATE INDEX idx_search_logs_zone ON public.search_logs(zone);
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert search logs" ON public.search_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view search logs" ON public.search_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============ AI LOGS ============
CREATE TABLE public.ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  query TEXT,
  result_type TEXT,
  clicked_item TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_ai_logs_created ON public.ai_logs(created_at DESC);
CREATE INDEX idx_ai_logs_event ON public.ai_logs(event_type);
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert ai logs" ON public.ai_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view ai logs" ON public.ai_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));