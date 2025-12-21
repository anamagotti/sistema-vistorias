-- Corrigir permissões e policies para usar a tabela 'users' em vez de 'profiles'

-- 1. Atualizar seu usuário para ser admin (substitua o email se necessário, ou isso afetará todos os usuários se remover o WHERE)
UPDATE public.users
SET role = 'admin';

-- 2. Remover policies antigas que podem estar conflitando ou usando a tabela errada
DROP POLICY IF EXISTS "Only admins can insert inspections" ON public.inspections;
DROP POLICY IF EXISTS "Only admins can update inspections" ON public.inspections;
DROP POLICY IF EXISTS "inspections_insert_authenticated" ON public.inspections;
DROP POLICY IF EXISTS "inspections_update_own" ON public.inspections;

-- 3. Criar novas policies corretas apontando para a tabela 'users'
CREATE POLICY "Only admins can insert inspections"
  ON public.inspections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update inspections"
  ON public.inspections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
