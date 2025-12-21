INSERT INTO public.franchises (name, location) VALUES
  ('Bar do Português - Araraquara', 'Araraquara, SP')
ON CONFLICT DO NOTHING;
