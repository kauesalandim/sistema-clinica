-- Ajustar políticas RLS para dentistas

-- Remover política antiga
DROP POLICY IF EXISTS "dentists_select_all" ON public.dentists;

-- Criar nova política mais permissiva
CREATE POLICY "dentists_select_all" ON public.dentists 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Remover política antiga de user_profiles
DROP POLICY IF EXISTS "users_select_own_profile" ON public.user_profiles;

-- Criar política que permite ler dentistas para pacientes agendarem
CREATE POLICY "users_select_own_or_dentists" ON public.user_profiles 
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = id OR 
    (SELECT user_type FROM public.user_profiles WHERE id = auth.uid()) = 'patient'
  );

-- Criar política que permite ler todos os perfis de dentistas para agendamento
CREATE POLICY "users_select_dentist_profiles" ON public.user_profiles 
  FOR SELECT 
  TO authenticated
  USING (user_type = 'dentist');
