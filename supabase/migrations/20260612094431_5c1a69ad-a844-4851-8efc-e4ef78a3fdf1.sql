
-- Fix 1: reviews.guest_email publicly readable -> revoke column SELECT from anon
REVOKE SELECT (guest_email) ON public.reviews FROM anon;

-- Fix 2: visitor_tracking unrestricted UPDATE -> remove public update policy.
-- Updates should be performed server-side (service_role).
DROP POLICY IF EXISTS "Anyone can update tracking" ON public.visitor_tracking;
