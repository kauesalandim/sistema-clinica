-- Corrigir política RLS para permitir dentistas verem suas consultas
-- O problema é que dentist_id referencia dentists(id) que por sua vez referencia user_profiles(id)
-- Precisamos garantir que a política compare corretamente com o dentista logado

-- Remover política antiga
DROP POLICY IF EXISTS "appointments_select_own" ON public.appointments;

-- Nova política que permite dentistas verem suas consultas
CREATE POLICY "appointments_select_own" ON public.appointments FOR SELECT USING (
  auth.uid() = patient_id OR 
  auth.uid() = dentist_id
);

-- Política para paciente cancelar sua consulta
CREATE POLICY "appointments_update_patient_cancel" ON public.appointments FOR UPDATE 
  USING (auth.uid() = patient_id) 
  WITH CHECK (auth.uid() = patient_id);
