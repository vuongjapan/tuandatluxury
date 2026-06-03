
-- Hide guest_email from public/auth users; keep admin access intact (admin uses has_role policy + table grants for authenticated, but column-level revoke applies to all non-superuser roles)
-- Strategy: revoke table-level SELECT and grant SELECT on every column EXCEPT guest_email to anon and authenticated.
REVOKE SELECT ON public.reviews FROM anon, authenticated;

GRANT SELECT (id, guest_name, rating, title, content, image_url, room_type, stay_date, is_approved, is_featured, sort_order, created_at, updated_at)
  ON public.reviews TO anon, authenticated;

-- service_role keeps full access
GRANT ALL ON public.reviews TO service_role;
