-- 1. Garantir que as franquias existem
INSERT INTO public.franchises (name, location) VALUES
  ('Bar do Português - São José do Rio Preto', 'São José do Rio Preto, SP'),
  ('Bar do Português - Lençóis Paulista', 'Lençóis Paulista, SP'),
  ('Bar do Português - Araraquara', 'Araraquara, SP'),
  ('Bar do Português - Bauru', 'Bauru, SP')
ON CONFLICT DO NOTHING;

-- 2. Remover policies antigas de franquias que podem estar bloqueando
DROP POLICY IF EXISTS "franchises_select_all" ON public.franchises;
DROP POLICY IF EXISTS "franchises_insert_authenticated" ON public.franchises;
DROP POLICY IF EXISTS "franchises_update_authenticated" ON public.franchises;

-- 3. Criar policy permissiva para leitura (qualquer um pode ler, mesmo sem login, para garantir que apareça)
CREATE POLICY "franchises_select_public" ON public.franchises
  FOR SELECT USING (true);

-- 4. Criar policy para admin gerenciar
CREATE POLICY "franchises_all_admin" ON public.franchises
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
