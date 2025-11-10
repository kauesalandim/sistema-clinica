-- Insert common dental procedures
INSERT INTO public.procedures (name, description, duration_minutes) VALUES
  ('Canal', 'Tratamento de canal radicular', 60),
  ('Extração de Siso', 'Remoção de dente do siso', 45),
  ('Limpeza e Profilaxia', 'Limpeza profissional dos dentes', 30),
  ('Restauração', 'Restauração de cárie com resina', 30),
  ('Clareamento', 'Clareamento de dentes profissional', 45),
  ('Implante', 'Colocação de implante dentário', 90),
  ('Extração Simples', 'Extração de dente simples', 20),
  ('Raspagem Periodontal', 'Limpeza das raízes e bolsas periodontais', 60)
ON CONFLICT DO NOTHING;
