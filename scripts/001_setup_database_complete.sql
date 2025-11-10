-- ===================================================================
-- UNICIDENTAL - Script completo de criação do banco de dados
-- ===================================================================
-- Execute este script uma única vez. Ele criará todas as tabelas,
-- políticas de segurança e dados iniciais necessários.
-- ===================================================================

-- ===== TABELAS DE CONFIGURAÇÃO =====

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELAS DE USUÁRIOS =====

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'receptionist', 'dentist', 'patient')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf TEXT UNIQUE,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'Other')),
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELAS DE PACIENTES =====

CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  health_insurance_provider TEXT,
  health_insurance_number TEXT,
  medical_history TEXT,
  allergies TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  is_minor BOOLEAN DEFAULT FALSE,
  legal_guardian_id UUID REFERENCES public.user_profiles(id),
  guardian_consent_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELAS DE DENTISTAS =====

CREATE TABLE IF NOT EXISTS public.dentists (
  id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  registration_number TEXT UNIQUE NOT NULL,
  specialties TEXT,
  availability_status TEXT CHECK (availability_status IN ('available', 'busy', 'on_leave')) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELAS DE SERVIÇOS/PROCEDIMENTOS =====

CREATE TABLE IF NOT EXISTS public.procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2),
  estimated_duration_minutes INTEGER,
  pre_procedure_instructions TEXT,
  post_procedure_instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELAS DE AGENDAMENTOS =====

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id),
  procedure_id UUID NOT NULL REFERENCES public.procedures(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  notes TEXT,
  pre_appointment_reminder_sent BOOLEAN DEFAULT FALSE,
  confirmation_sent BOOLEAN DEFAULT FALSE,
  confirmed_by_patient BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dentist_id, appointment_date, appointment_time)
);

-- ===== TABELAS DE PRONTUÁRIO =====

CREATE TABLE IF NOT EXISTS public.patient_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id),
  clinical_notes TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  documents_attached TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELAS DE PAGAMENTOS/ORÇAMENTOS =====

CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  items JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  validity_days INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('credit_card', 'debit_card', 'cash', 'check', 'pix')) DEFAULT 'cash',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  payment_date TIMESTAMP,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELAS DE COMUNICAÇÃO =====

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  notification_type TEXT CHECK (notification_type IN ('appointment_reminder', 'confirmation_request', 'payment_reminder', 'general_info', 'post_care', 'faq_response')) DEFAULT 'appointment_reminder',
  message TEXT NOT NULL,
  channel TEXT CHECK (channel IN ('whatsapp', 'email', 'sms', 'in_app')) DEFAULT 'whatsapp',
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'read')) DEFAULT 'pending',
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELAS DE DOCUMENTOS =====

CREATE TABLE IF NOT EXISTS public.patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  document_type TEXT CHECK (document_type IN ('radiography', 'exam', 'certificate', 'prescription', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELAS DE RELATÓRIOS =====

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== ATIVAR ROW LEVEL SECURITY =====

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

-- user_profiles
DROP POLICY IF EXISTS "users_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;

CREATE POLICY "users_select_own_profile" ON public.user_profiles FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "users_insert_own_profile" ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- patients
DROP POLICY IF EXISTS "patients_select_own" ON public.patients;
DROP POLICY IF EXISTS "patients_insert_own" ON public.patients;
DROP POLICY IF EXISTS "patients_update_own" ON public.patients;

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

-- dentists
DROP POLICY IF EXISTS "dentists_select_own" ON public.dentists;
DROP POLICY IF EXISTS "dentists_insert_own" ON public.dentists;
DROP POLICY IF EXISTS "dentists_update_own" ON public.dentists;

CREATE POLICY "dentists_select_own" ON public.dentists FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist'));

CREATE POLICY "dentists_insert_own" ON public.dentists FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "dentists_update_own" ON public.dentists FOR UPDATE
  USING (auth.uid() = id OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- procedures
DROP POLICY IF EXISTS "procedures_select_all" ON public.procedures;
DROP POLICY IF EXISTS "procedures_modify_admin" ON public.procedures;
DROP POLICY IF EXISTS "procedures_update_admin" ON public.procedures;

CREATE POLICY "procedures_select_all" ON public.procedures FOR SELECT
  USING (TRUE);

CREATE POLICY "procedures_modify_admin" ON public.procedures FOR INSERT
  WITH CHECK ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "procedures_update_admin" ON public.procedures FOR UPDATE
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- appointments
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_patient" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;

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

-- patient_records
DROP POLICY IF EXISTS "patient_records_select" ON public.patient_records;
DROP POLICY IF EXISTS "patient_records_insert" ON public.patient_records;

CREATE POLICY "patient_records_select" ON public.patient_records FOR SELECT
  USING (
    patient_id = auth.uid() OR
    dentist_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "patient_records_insert" ON public.patient_records FOR INSERT
  WITH CHECK (dentist_id = auth.uid() OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- budgets
DROP POLICY IF EXISTS "budgets_select" ON public.budgets;
DROP POLICY IF EXISTS "budgets_insert" ON public.budgets;

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

-- payments
DROP POLICY IF EXISTS "payments_select" ON public.payments;
DROP POLICY IF EXISTS "payments_insert" ON public.payments;

CREATE POLICY "payments_select" ON public.payments FOR SELECT
  USING (
    patient_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist', 'dentist')
  );

CREATE POLICY "payments_insert" ON public.payments FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist', 'dentist')
  );

-- notifications
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT
  USING (
    patient_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist', 'dentist')
  );

CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'receptionist', 'dentist')
  );

-- patient_documents
DROP POLICY IF EXISTS "patient_documents_select" ON public.patient_documents;
DROP POLICY IF EXISTS "patient_documents_insert" ON public.patient_documents;

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

-- activity_logs
DROP POLICY IF EXISTS "activity_logs_select" ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert" ON public.activity_logs;

CREATE POLICY "activity_logs_select" ON public.activity_logs FOR SELECT
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT
  WITH CHECK (TRUE);

-- faq
DROP POLICY IF EXISTS "faq_select_all" ON public.faq;
DROP POLICY IF EXISTS "faq_modify_admin" ON public.faq;
DROP POLICY IF EXISTS "faq_update_admin" ON public.faq;

CREATE POLICY "faq_select_all" ON public.faq FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "faq_modify_admin" ON public.faq FOR INSERT
  WITH CHECK ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "faq_update_admin" ON public.faq FOR UPDATE
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- ===== CRIAR TRIGGER PARA NOVOS USUÁRIOS =====

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    role
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'role', 'patient')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===== INSERIR DADOS INICIAIS =====

-- Procedimentos
INSERT INTO public.procedures (name, description, base_price, estimated_duration_minutes, pre_procedure_instructions, post_procedure_instructions, is_active)
VALUES
  ('Limpeza Básica', 'Limpeza e polimento de dentes', 150.00, 30, 'Evitar alimentos pegajosos antes do procedimento', 'Não comer por 2 horas após', TRUE),
  ('Restauração em Resina', 'Restauração de cáries com material estético', 200.00, 45, 'Jejum não obrigatório', 'Cuidar com alimentos duros nos primeiros dias', TRUE),
  ('Extração Dentária', 'Remoção de dente', 300.00, 30, 'Fazer jejum de 4 horas', 'Repouso total por 24h, gelo na região a cada 20 minutos', TRUE),
  ('Canal Radicular', 'Tratamento do canal da raiz', 500.00, 120, 'Trazer raio-X recente, evitar alimentos quentes', 'Medicação conforme recomendação, evitar mastigar no dente tratado', TRUE),
  ('Clareamento Dentário', 'Clareamento profissional dos dentes', 250.00, 60, 'Fazer limpeza 48h antes, não fazer em alimentos com pigmentação', 'Evitar alimentos/bebidas pigmentadas por 48h', TRUE),
  ('Implante Dentário', 'Colocação de implante', 2000.00, 90, 'Jejum de 6 horas, tomar antibiótico conforme recomendação', 'Higiene especial por 2 semanas, dieta mole, não fumar', TRUE),
  ('Consulta de Rotina', 'Avaliação e limpeza preventiva', 100.00, 30, 'Nenhuma instrução especial', 'Escovar os dentes normalmente após 1h', TRUE)
ON CONFLICT DO NOTHING;

-- FAQ
INSERT INTO public.faq (category, question, answer, is_active, order_index)
VALUES
  ('Geral', 'Qual é o horário de funcionamento da clínica?', 'Funcionamos de segunda a sexta, das 8h às 18h. Consulte nossa localização no Google Maps para mais informações.', TRUE, 1),
  ('Agendamento', 'Como faço para agendar uma consulta?', 'Você pode agendar pelo nosso chatbot WhatsApp, pelo portal online ou ligando diretamente para a clínica.', TRUE, 2),
  ('Agendamento', 'Posso remarcar ou cancelar minha consulta?', 'Sim! Você pode remarcar ou cancelar até 24 horas antes pelo WhatsApp ou portal.', TRUE, 3),
  ('Pagamento', 'Quais formas de pagamento vocês aceitam?', 'Aceitamos dinheiro, débito, crédito, PIX e talão de cheque.', TRUE, 4),
  ('Pagamento', 'É possível parcelar o tratamento?', 'Sim, podemos ofertar parcelamentos em até 12x no cartão de crédito. Consulte nossa equipe.', TRUE, 5),
  ('Menores', 'Como funciona o atendimento de menores de idade?', 'Menores devem ter um responsável legal cadastrado. O responsável recebe orçamentos e notificações.', TRUE, 6),
  ('Higiene', 'Quais são as medidas de higiene da clínica?', 'Seguimos rigorosamente os protocolos de biossegurança, esterilização de materiais e limpeza.', TRUE, 7),
  ('Documentos', 'Vocês emitem atestado médico?', 'Sim, o dentista pode emitir atestado conforme necessário após o atendimento.', TRUE, 8)
ON CONFLICT DO NOTHING;
