-- Corrigir recursão infinita nas policies da tabela users

-- 1. Remover todas as policies problemáticas da tabela users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- 2. Criar policies simplificadas que evitam recursão
-- Permitir que qualquer usuário autenticado leia dados de usuários (necessário para verificar roles)
CREATE POLICY "allow_read_users" ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir que usuários atualizem apenas seus próprios dados
CREATE POLICY "allow_update_own_user" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Permitir inserção (geralmente feita pelo trigger, mas bom ter)
CREATE POLICY "allow_insert_own_user" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Garantir que a tabela franchises está legível
ALTER TABLE public.franchises DISABLE ROW LEVEL SECURITY;
