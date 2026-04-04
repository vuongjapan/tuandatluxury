DROP POLICY IF EXISTS "Service can insert webhook logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Service can select webhook logs" ON public.webhook_logs;

CREATE POLICY "Admins can read webhook logs"
ON public.webhook_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Backend can insert webhook logs"
ON public.webhook_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));