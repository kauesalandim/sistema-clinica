-- Verifica e corrige RLS para appointments
-- Permitir que pacientes vejam suas próprias consultas
DROP POLICY IF EXISTS "patients_view_own_appointments" ON appointments;
CREATE POLICY "patients_view_own_appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = patient_id);

-- Permitir que pacientes cancelem suas próprias consultas
DROP POLICY IF EXISTS "patients_update_own_appointments" ON appointments;
CREATE POLICY "patients_update_own_appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Permitir que dentistas vejam suas consultas
DROP POLICY IF EXISTS "dentists_view_appointments" ON appointments;
CREATE POLICY "dentists_view_appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = dentist_id);

-- Permitir que dentistas confirmem suas consultas
DROP POLICY IF EXISTS "dentists_update_appointments" ON appointments;
CREATE POLICY "dentists_update_appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = dentist_id)
  WITH CHECK (auth.uid() = dentist_id);
