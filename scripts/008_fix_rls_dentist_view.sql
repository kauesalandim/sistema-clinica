-- Corrigindo políticas RLS para dentistas verem suas consultas e pacientes

-- Remover políticas antigas de appointments
DROP POLICY IF EXISTS "appointments_select_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_dentist_confirm" ON public.appointments;

-- Nova política: pacientes veem suas próprias consultas
CREATE POLICY "appointments_select_patient_own" ON public.appointments 
FOR SELECT USING (auth.uid() = patient_id);

-- Nova política: dentistas veem consultas agendadas para eles
CREATE POLICY "appointments_select_dentist_own" ON public.appointments 
FOR SELECT USING (
  (SELECT id FROM public.dentists WHERE id = auth.uid()) = dentist_id
);

-- Pacientes inserem suas próprias consultas
CREATE POLICY "appointments_insert_own" ON public.appointments 
FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Dentistas confirmam consultas deles
CREATE POLICY "appointments_update_dentist_confirm" ON public.appointments 
FOR UPDATE USING (
  (SELECT id FROM public.dentists WHERE id = auth.uid()) = dentist_id
) WITH CHECK (
  (SELECT id FROM public.dentists WHERE id = auth.uid()) = dentist_id
);

-- Remover políticas antigas de user_profiles
DROP POLICY IF EXISTS "users_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;

-- Nova política: usuários veem seu próprio perfil
CREATE POLICY "users_select_own" ON public.user_profiles 
FOR SELECT USING (auth.uid() = id);

-- Nova política: dentistas veem perfil de pacientes associados
CREATE POLICY "users_select_dentist_patients" ON public.user_profiles 
FOR SELECT USING (
  user_type = 'patient' AND 
  EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE appointments.dentist_id = auth.uid() 
    AND appointments.patient_id = id
  )
);

-- Usuários inserem seu próprio perfil
CREATE POLICY "users_insert_own" ON public.user_profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Usuários atualizam seu próprio perfil
CREATE POLICY "users_update_own" ON public.user_profiles 
FOR UPDATE USING (auth.uid() = id);
