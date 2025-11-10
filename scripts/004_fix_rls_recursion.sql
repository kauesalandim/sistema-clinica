-- Desabilitar RLS temporariamente para corrigir o problema
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dentists DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas problemáticas
DROP POLICY IF EXISTS "users_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_select_own_or_dentists" ON public.user_profiles;
DROP POLICY IF EXISTS "users_select_dentist_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "dentists_select_all" ON public.dentists;

-- Re-habilitar RLS com políticas simples que não causam recursão
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dentists ENABLE ROW LEVEL SECURITY;

-- Política simples para user_profiles: usuários veem sua própria conta
CREATE POLICY "user_select_own_profile" ON public.user_profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Política para dentistas: qualquer um autenticado pode ver (sem subconsulta!)
CREATE POLICY "public_select_dentist_profiles" ON public.user_profiles 
  FOR SELECT 
  TO authenticated
  USING (user_type = 'dentist');

-- Política simples para dentistas: qualquer um autenticado pode ler
CREATE POLICY "public_select_dentists" ON public.dentists 
  FOR SELECT 
  TO authenticated
  USING (true);
