-- Função segura para dentistas buscarem dados de seus pacientes
CREATE OR REPLACE FUNCTION get_patient_info(patient_id UUID)
RETURNS TABLE(full_name TEXT, phone TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.full_name,
    up.phone
  FROM public.user_profiles up
  WHERE up.id = patient_id
    AND EXISTS (
      SELECT 1 FROM public.appointments apt
      WHERE apt.patient_id = up.id
      AND apt.dentist_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para usuários autenticados chamar essa função
GRANT EXECUTE ON FUNCTION get_patient_info(UUID) TO authenticated;
