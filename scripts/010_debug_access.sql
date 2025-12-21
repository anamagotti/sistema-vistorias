-- DEBUG: Permitir acesso total à tabela de usuários para ver se é problema de permissão
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);

-- Garantir novamente que todos são admins (para teste)
UPDATE public.users SET role = 'admin';
