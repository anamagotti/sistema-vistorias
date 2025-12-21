-- Inserir franquias de exemplo
INSERT INTO public.franchises (name, location) VALUES
  ('Bar do Português - São José do Rio Preto', 'São José do Rio Preto, SP'),
  ('Bar do Português - Lençóis Paulista', 'Lençóis Paulista, SP'),
  ('Bar do Português - Araraquara', 'Araraquara, SP'),
  ('Bar do Português - Bauru', 'Bauru, SP')
ON CONFLICT DO NOTHING;
