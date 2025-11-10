-- Create users profile table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('patient', 'dentist')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dentists table with professional info
CREATE TABLE IF NOT EXISTS public.dentists (
  id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  cro TEXT UNIQUE NOT NULL,
  specialization TEXT,
  bio TEXT
);

-- Create procedures table
CREATE TABLE IF NOT EXISTS public.procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES public.procedures(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  location TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  confirmed_by_dentist_at TIMESTAMP WITH TIME ZONE,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dentists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "users_select_own_profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own_profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for dentists (public select, own update)
CREATE POLICY "dentists_select_all" ON public.dentists FOR SELECT USING (true);
CREATE POLICY "dentists_insert_own" ON public.dentists FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "dentists_update_own" ON public.dentists FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for procedures (public select)
CREATE POLICY "procedures_select_all" ON public.procedures FOR SELECT USING (true);

-- RLS Policies for appointments
CREATE POLICY "appointments_select_own" ON public.appointments FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = dentist_id);
CREATE POLICY "appointments_insert_own" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "appointments_update_dentist_confirm" ON public.appointments FOR UPDATE USING (auth.uid() = dentist_id) WITH CHECK (auth.uid() = dentist_id);

-- Create trigger to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, phone, user_type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'user_type', 'patient')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
