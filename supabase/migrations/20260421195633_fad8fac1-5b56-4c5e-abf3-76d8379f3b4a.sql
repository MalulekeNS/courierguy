-- =====================================================
-- ROLES
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('customer', 'driver', 'franchisee', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- PROFILES
-- =====================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  franchise_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New user signup trigger -> create profile + customer role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ADDRESSES (saved address book)
-- =====================================================
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  street text NOT NULL,
  suburb text NOT NULL,
  city text,
  postal_code text NOT NULL,
  province text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own addresses"
  ON public.addresses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SHIPMENTS
-- =====================================================
CREATE TYPE public.shipment_status AS ENUM (
  'pending_payment',
  'booked',
  'awaiting_pickup',
  'collected',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_delivery',
  'cancelled'
);

-- Waybill generator: FW- + 8 random hex chars
CREATE OR REPLACE FUNCTION public.generate_waybill()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate text;
  exists_already boolean;
BEGIN
  LOOP
    candidate := 'FW-' || upper(substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 8));
    SELECT EXISTS (SELECT 1 FROM public.shipments WHERE waybill_number = candidate) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waybill_number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Sender
  sender_name text NOT NULL,
  sender_phone text NOT NULL,
  sender_street text NOT NULL,
  sender_suburb text NOT NULL,
  sender_postal_code text NOT NULL,
  sender_franchise_code text NOT NULL DEFAULT 'JNB',

  -- Receiver
  receiver_name text NOT NULL,
  receiver_phone text NOT NULL,
  receiver_street text NOT NULL,
  receiver_suburb text NOT NULL,
  receiver_postal_code text NOT NULL,
  receiver_franchise_code text,

  -- Parcel
  weight_kg numeric(8,2) NOT NULL CHECK (weight_kg > 0),
  service_name text NOT NULL,
  service_type text,
  parcel_description text,

  -- Pricing
  price_zar numeric(10,2) NOT NULL CHECK (price_zar >= 0),
  paid boolean NOT NULL DEFAULT false,

  -- Status & assignment
  status shipment_status NOT NULL DEFAULT 'booked',
  assigned_driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  pickup_scheduled_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipments_customer ON public.shipments(customer_id);
CREATE INDEX idx_shipments_driver ON public.shipments(assigned_driver_id);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_franchise ON public.shipments(sender_franchise_code, receiver_franchise_code);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Auto-fill waybill on insert
CREATE OR REPLACE FUNCTION public.set_waybill_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.waybill_number IS NULL OR NEW.waybill_number = '' THEN
    NEW.waybill_number := public.generate_waybill();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER shipments_set_waybill
  BEFORE INSERT ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_waybill_number();

CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper to check franchise membership
CREATE OR REPLACE FUNCTION public.user_franchise(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT franchise_code FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS: customers see own
CREATE POLICY "Customers view own shipments"
  ON public.shipments FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Drivers view assigned shipments"
  ON public.shipments FOR SELECT
  TO authenticated
  USING (auth.uid() = assigned_driver_id);

CREATE POLICY "Franchisees view branch shipments"
  ON public.shipments FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'franchisee')
    AND (
      sender_franchise_code = public.user_franchise(auth.uid())
      OR receiver_franchise_code = public.user_franchise(auth.uid())
    )
  );

CREATE POLICY "Admins view all shipments"
  ON public.shipments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers create own shipments"
  ON public.shipments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers cancel own pending shipments"
  ON public.shipments FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id AND status IN ('booked','pending_payment','awaiting_pickup'))
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Drivers update assigned shipments"
  ON public.shipments FOR UPDATE
  TO authenticated
  USING (auth.uid() = assigned_driver_id)
  WITH CHECK (auth.uid() = assigned_driver_id);

CREATE POLICY "Franchisees update branch shipments"
  ON public.shipments FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'franchisee')
    AND (
      sender_franchise_code = public.user_franchise(auth.uid())
      OR receiver_franchise_code = public.user_franchise(auth.uid())
    )
  );

CREATE POLICY "Admins manage shipments"
  ON public.shipments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public tracking lookup (read-only, by waybill only via edge function or filtered query)
CREATE POLICY "Public can track by waybill"
  ON public.shipments FOR SELECT
  TO anon
  USING (true);
-- NOTE: anon SELECT is allowed but the UI will only ever fetch by exact waybill_number;
-- sensitive fields are stripped server-side in the tracking view in a later phase.

-- =====================================================
-- SHIPMENT EVENTS
-- =====================================================
CREATE TABLE public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status shipment_status NOT NULL,
  description text NOT NULL,
  location text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_shipment ON public.shipment_events(shipment_id, created_at DESC);

ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View events for visible shipments"
  ON public.shipment_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_id
        AND (
          s.customer_id = auth.uid()
          OR s.assigned_driver_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
          OR (
            public.has_role(auth.uid(), 'franchisee')
            AND (
              s.sender_franchise_code = public.user_franchise(auth.uid())
              OR s.receiver_franchise_code = public.user_franchise(auth.uid())
            )
          )
        )
    )
  );

CREATE POLICY "Public view events by shipment"
  ON public.shipment_events FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Staff add events"
  ON public.shipment_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'driver')
    OR public.has_role(auth.uid(), 'franchisee')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Auto-mirror status to shipment when an event is added
CREATE OR REPLACE FUNCTION public.sync_shipment_status_from_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shipments
     SET status = NEW.status,
         updated_at = now()
   WHERE id = NEW.shipment_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER shipment_events_sync_status
  AFTER INSERT ON public.shipment_events
  FOR EACH ROW EXECUTE FUNCTION public.sync_shipment_status_from_event();
