-- Remove a constraint de foreign key e corrige para referenciar user_profiles ao invés de dentists
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_dentist_id_fkey;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_dentist_id_fkey FOREIGN KEY (dentist_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
