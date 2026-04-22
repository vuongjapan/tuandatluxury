CREATE TABLE public.transport_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  room_number TEXT,
  transport_type TEXT NOT NULL CHECK (transport_type IN ('airport', 'beach', 'square')),
  pickup_location TEXT,
  dropoff_location TEXT,
  pickup_datetime TIMESTAMPTZ NOT NULL,
  passengers INTEGER NOT NULL DEFAULT 1,
  luggage TEXT,
  flight_number TEXT,
  notes TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transport_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert transport bookings"
ON public.transport_bookings FOR INSERT
TO anon, authenticated
WITH CHECK (
  guest_name IS NOT NULL
  AND guest_phone IS NOT NULL
  AND length(guest_name) > 0
  AND length(guest_phone) >= 8
);

CREATE POLICY "Public can view transport bookings"
ON public.transport_bookings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage transport bookings"
ON public.transport_bookings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_transport_bookings_updated_at
BEFORE UPDATE ON public.transport_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_transport_status ON public.transport_bookings(status);
CREATE INDEX idx_transport_pickup ON public.transport_bookings(pickup_datetime);
CREATE INDEX idx_transport_type ON public.transport_bookings(transport_type);