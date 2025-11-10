-- Dados iniciais para a clínica

-- Inserir procedimentos
INSERT INTO public.procedures (name, description, base_price, estimated_duration_minutes, pre_procedure_instructions, post_procedure_instructions, is_active)
VALUES
  ('Limpeza Básica', 'Limpeza e polimento de dentes', 150.00, 30, 'Evitar alimentos pegajosos antes do procedimento', 'Não comer por 2 horas após', TRUE),
  ('Restauração em Resina', 'Restauração de cáries com material estético', 200.00, 45, 'Jejum não obrigatório', 'Cuidar com alimentos duros nos primeiros dias', TRUE),
  ('Extração Dentária', 'Remoção de dente', 300.00, 30, 'Fazer jejum de 4 horas', 'Repouso total por 24h, gelo na região a cada 20 minutos', TRUE),
  ('Canal Radicular', 'Tratamento do canal da raiz', 500.00, 120, 'Trazer raio-X recente, evitar alimentos quentes', 'Medicação conforme recomendação, evitar mastigar no dente tratado', TRUE),
  ('Clareamento Dentário', 'Clareamento profissional dos dentes', 250.00, 60, 'Fazer limpeza 48h antes, não fazer em alimentos com pigmentação', 'Evitar alimentos/bebidas pigmentadas por 48h', TRUE),
  ('Implante Dentário', 'Colocação de implante', 2000.00, 90, 'Jejum de 6 horas, tomar antibiótico conforme recomendação', 'Higiene especial por 2 semanas, dieta mole, não fumar', TRUE),
  ('Consulta de Rotina', 'Avaliação e limpeza preventiva', 100.00, 30, 'Nenhuma instrução especial', 'Escovar os dentes normalmente após 1h', TRUE);

-- Inserir FAQ
INSERT INTO public.faq (category, question, answer, is_active, order_index)
VALUES
  ('Geral', 'Qual é o horário de funcionamento da clínica?', 'Funcionamos de segunda a sexta, das 8h às 18h. Consulte nossa localização no Google Maps para mais informações.', TRUE, 1),
  ('Agendamento', 'Como faço para agendar uma consulta?', 'Você pode agendar pelo nosso chatbot WhatsApp, pelo portal online ou ligando diretamente para a clínica.', TRUE, 2),
  ('Agendamento', 'Posso remarcar ou cancelar minha consulta?', 'Sim! Você pode remarcar ou cancelar até 24 horas antes pelo WhatsApp ou portal.', TRUE, 3),
  ('Pagamento', 'Quais formas de pagamento vocês aceitam?', 'Aceitamos dinheiro, débito, crédito, PIX e talão de cheque.', TRUE, 4),
  ('Pagamento', 'É possível parcelar o tratamento?', 'Sim, podemos ofertar parcelamentos em até 12x no cartão de crédito. Consulte nossa equipe.', TRUE, 5),
  ('Menores', 'Como funciona o atendimento de menores de idade?', 'Menores devem ter um responsável legal cadastrado. O responsável recebe orçamentos e notificações.', TRUE, 6),
  ('Higiene', 'Quais são as medidas de higiene da clínica?', 'Seguimos rigorosamente os protocolos de biossegurança, esterilização de materiais e limpeza.', TRUE, 7),
  ('Documentos', 'Vocês emitem atestado médico?', 'Sim, o dentista pode emitir atestado conforme necessário após o atendimento.', TRUE, 8);
