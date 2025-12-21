-- Sincronizar usuários do Auth para a tabela public.users
-- Isso garante que seu usuário exista na tabela correta e tenha permissão de admin

INSERT INTO public.users (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email),
  'admin'
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- Garantir que a coluna role não tenha restrições antigas que impeçam 'admin'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
