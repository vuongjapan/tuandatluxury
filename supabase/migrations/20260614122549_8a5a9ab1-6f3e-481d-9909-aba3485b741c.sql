-- Fix 1: Hide guest_email on reviews from anonymous public reads
REVOKE SELECT (guest_email) ON public.reviews FROM anon;
REVOKE SELECT (guest_email) ON public.reviews FROM authenticated;
-- Admins use service-role or the "Admins manage reviews" policy via has_role; grant them column back explicitly via authenticated role through a view-less approach: keep admin SELECT working by re-granting at table level only to service_role (already has ALL). For authenticated admins, they use the existing policy on all columns; we grant guest_email back to authenticated but rely on policy filter.
-- Re-grant to authenticated so the admin policy can still return guest_email for admins (RLS will still filter rows; column grant is required to even mention column).
GRANT SELECT (guest_email) ON public.reviews TO authenticated;

-- Fix 2: Lock down visitors table; move writes through SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Anyone can insert visitor" ON public.visitors;
DROP POLICY IF EXISTS "Anyone can update visitor by id" ON public.visitors;
DROP POLICY IF EXISTS "Self read by visitor_id" ON public.visitors;
-- Keep "Admins read visitors"

CREATE OR REPLACE FUNCTION public.track_visitor(
  p_visitor_id text,
  p_path text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_source_domain text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_country_code text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_bump boolean DEFAULT true
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_visitor_id IS NULL OR length(p_visitor_id) < 8 OR length(p_visitor_id) > 128 THEN
    RAISE EXCEPTION 'invalid visitor_id';
  END IF;

  INSERT INTO public.visitors (
    visitor_id, visit_count, source_domain, last_path, user_agent,
    country, country_code, region, city, first_seen, last_seen
  ) VALUES (
    p_visitor_id, 1,
    left(coalesce(p_source_domain,''), 255),
    left(coalesce(p_path,''), 500),
    left(coalesce(p_user_agent,''), 500),
    left(coalesce(p_country,''), 100),
    left(coalesce(p_country_code,''), 8),
    left(coalesce(p_region,''), 100),
    left(coalesce(p_city,''), 100),
    now(), now()
  )
  ON CONFLICT (visitor_id) DO UPDATE SET
    visit_count = public.visitors.visit_count + (CASE WHEN p_bump THEN 1 ELSE 0 END),
    last_seen = now(),
    last_path = COALESCE(left(p_path, 500), public.visitors.last_path),
    user_agent = COALESCE(NULLIF(left(p_user_agent, 500), ''), public.visitors.user_agent),
    source_domain = COALESCE(NULLIF(left(p_source_domain, 255), ''), public.visitors.source_domain),
    country = COALESCE(NULLIF(left(p_country, 100), ''), public.visitors.country),
    country_code = COALESCE(NULLIF(left(p_country_code, 8), ''), public.visitors.country_code),
    region = COALESCE(NULLIF(left(p_region, 100), ''), public.visitors.region),
    city = COALESCE(NULLIF(left(p_city, 100), ''), public.visitors.city);
END;
$$;

REVOKE ALL ON FUNCTION public.track_visitor(text,text,text,text,text,text,text,text,boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.track_visitor(text,text,text,text,text,text,text,text,boolean) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.visitor_heartbeat(p_visitor_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_visitor_id IS NULL OR length(p_visitor_id) < 8 OR length(p_visitor_id) > 128 THEN
    RETURN;
  END IF;
  UPDATE public.visitors SET last_seen = now() WHERE visitor_id = p_visitor_id;
END;
$$;

REVOKE ALL ON FUNCTION public.visitor_heartbeat(text) FROM public;
GRANT EXECUTE ON FUNCTION public.visitor_heartbeat(text) TO anon, authenticated;