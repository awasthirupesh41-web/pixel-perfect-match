CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  emergency_contact_name text NOT NULL DEFAULT '',
  emergency_contact_phone text NOT NULL DEFAULT '',
  medical_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE FUNCTION public.create_profile_for_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', '')); RETURN NEW; END; $$;
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','driver','operator','hospital')),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.ambulances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code text NOT NULL UNIQUE,
  driver_name text NOT NULL DEFAULT 'Unassigned driver',
  driver_phone text NOT NULL DEFAULT '',
  vehicle_model text NOT NULL DEFAULT 'Advanced Life Support',
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','busy','offline')),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  hospital_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambulances TO authenticated;
GRANT ALL ON public.ambulances TO service_role;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read ambulances" ON public.ambulances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in users can manage demo fleet" ON public.ambulances FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  emergency_department_available boolean NOT NULL DEFAULT true,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospitals TO authenticated;
GRANT ALL ON public.hospitals TO service_role;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read hospitals" ON public.hospitals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in users can manage demo hospitals" ON public.hospitals FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.ambulances ADD CONSTRAINT ambulances_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE SET NULL;

CREATE TABLE public.emergency_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','simulated_accident')),
  severity text NOT NULL DEFAULT 'high' CHECK (severity IN ('moderate','high','critical')),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','assigned','accepted','en_route','arrived','patient_picked_up','hospital_arrival','completed','cancelled')),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  location_label text NOT NULL DEFAULT 'Location shared by user',
  ambulance_id uuid REFERENCES public.ambulances(id) ON DELETE SET NULL,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
  eta_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_requests TO authenticated;
GRANT ALL ON public.emergency_requests TO service_role;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their emergency requests" ON public.emergency_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own emergency requests" ON public.emergency_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their emergency requests" ON public.emergency_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their emergency requests" ON public.emergency_requests FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  phone text NOT NULL,
  relationship text NOT NULL DEFAULT 'Emergency contact',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their emergency contacts" ON public.emergency_contacts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ambulance_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  ambulance_id uuid NOT NULL REFERENCES public.ambulances(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'assigned',
  eta_minutes integer NOT NULL DEFAULT 8,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambulance_assignments TO authenticated;
GRANT ALL ON public.ambulance_assignments TO service_role;
ALTER TABLE public.ambulance_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read assignments for their requests" ON public.ambulance_assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.emergency_requests request WHERE request.id = request_id AND request.user_id = auth.uid()));
CREATE POLICY "Users can create assignments for their requests" ON public.ambulance_assignments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.emergency_requests request WHERE request.id = request_id AND request.user_id = auth.uid()));
CREATE POLICY "Users can update assignments for their requests" ON public.ambulance_assignments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.emergency_requests request WHERE request.id = request_id AND request.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.emergency_requests request WHERE request.id = request_id AND request.user_id = auth.uid()));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  request_id uuid REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  kind text NOT NULL DEFAULT 'dispatch',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.hospitals (id, name, address, phone, emergency_department_available, latitude, longitude) VALUES
  ('a0000000-0000-4000-8000-000000000001','Kathmandu Civil Hospital','Min Bhawan, Kathmandu','+977 1 4107000',true,27.6957,85.3373),
  ('a0000000-0000-4000-8000-000000000002','Patan Hospital','Lagankhel, Lalitpur','+977 1 5522278',true,27.6675,85.3247),
  ('a0000000-0000-4000-8000-000000000003','Tribhuvan University Teaching Hospital','Maharajgunj, Kathmandu','+977 1 4412303',true,27.7351,85.3301);
INSERT INTO public.ambulances (unit_code, driver_name, driver_phone, vehicle_model, status, latitude, longitude, hospital_id) VALUES
  ('AMB-07','Rajan Shrestha','+977 980-100-1107','Advanced Life Support','available',27.7012,85.3321,'a0000000-0000-4000-8000-000000000001'),
  ('AMB-12','Sita Karki','+977 980-100-1112','Critical Care Unit','available',27.6741,85.3198,'a0000000-0000-4000-8000-000000000002'),
  ('AMB-03','Bikash Thapa','+977 980-100-1103','Advanced Life Support','busy',27.7282,85.3255,'a0000000-0000-4000-8000-000000000003'),
  ('AMB-19','Anil Gurung','+977 980-100-1119','Basic Life Support','offline',27.6889,85.3442,'a0000000-0000-4000-8000-000000000001');
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;