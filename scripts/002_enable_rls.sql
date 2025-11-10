-- Ativar Row Level Security para todas as tabelas

-- ===== ATIVAR RLS =====

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dentists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS DE RLS =====

-- user_profiles: Usuários podem ver seu próprio perfil. Admins veem todos.
CREATE POLICY "users_select_own_profile" ON public.user_profiles FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "users_insert_own_profile" ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- patients: Pacientes veem seu próprio registro. Dentistas/Recepcionistas veem pacientes que agendaram com eles
CREATE POLICY "patients_select_own" ON public.patients FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE appointments.patient_id = patients.id 
      AND appointments.dentist_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

CREATE POLICY "patients_insert_own" ON public.patients FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "patients_update_own" ON public.patients FOR UPDATE
  USING (auth.uid() = id OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- dentists: Dentistas veem seu próprio registro. Admin vê todos
CREATE POLICY "dentists_select_own" ON public.dentists FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist'));

CREATE POLICY "dentists_insert_own" ON public.dentists FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "dentists_update_own" ON public.dentists FOR UPDATE
  USING (auth.uid() = id OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- procedures: Todos podem ver. Admin modifica
CREATE POLICY "procedures_select_all" ON public.procedures FOR SELECT
  USING (TRUE);

CREATE POLICY "procedures_modify_admin" ON public.procedures FOR INSERT
  WITH CHECK ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "procedures_update_admin" ON public.procedures FOR UPDATE
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- appointments: Paciente vê seus. Dentista vê seus. Admin/Recepção veem todos
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT
  USING (
    patient_id = auth.uid() OR
    dentist_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist')
  );

CREATE POLICY "appointments_insert_patient" ON public.appointments FOR INSERT
  WITH CHECK (patient_id = auth.uid() OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist'));

CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE
  USING (
    patient_id = auth.uid() OR
    dentist_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist')
  );

-- patient_records: Paciente vê seus. Dentista que criou vê. Admin vê todos
CREATE POLICY "patient_records_select" ON public.patient_records FOR SELECT
  USING (
    patient_id = auth.uid() OR
    dentist_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "patient_records_insert" ON public.patient_records FOR INSERT
  WITH CHECK (dentist_id = auth.uid() OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- budgets: Paciente vê seus. Dentista/Recepção veem do seu paciente. Admin vê todos
CREATE POLICY "budgets_select" ON public.budgets FOR SELECT
  USING (
    patient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE appointments.patient_id = budgets.patient_id 
      AND appointments.dentist_id = auth.uid()
    ) OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist')
  );

CREATE POLICY "budgets_insert" ON public.budgets FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist', 'dentist')
  );

-- payments: Paciente vê seus. Staff vê todos
CREATE POLICY "payments_select" ON public.payments FOR SELECT
  USING (
    patient_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist', 'dentist')
  );

CREATE POLICY "payments_insert" ON public.payments FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist', 'dentist')
  );

-- notifications: Paciente vê suas. Staff pode enviar
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT
  USING (
    patient_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist', 'dentist')
  );

CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist', 'dentist')
  );

-- patient_documents: Paciente vê seus. Dentista que criou/Recepção veem. Admin vê todos
CREATE POLICY "patient_documents_select" ON public.patient_documents FOR SELECT
  USING (
    patient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE appointments.patient_id = patient_documents.patient_id 
      AND appointments.dentist_id = auth.uid()
    ) OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist')
  );

CREATE POLICY "patient_documents_insert" ON public.patient_documents FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist', 'dentist')
  );

-- activity_logs: Somente admins veem
CREATE POLICY "activity_logs_select" ON public.activity_logs FOR SELECT
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT
  WITH CHECK (TRUE);

-- faq: Todos veem
CREATE POLICY "faq_select_all" ON public.faq FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "faq_modify_admin" ON public.faq FOR INSERT
  WITH CHECK ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "faq_update_admin" ON public.faq FOR UPDATE
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
