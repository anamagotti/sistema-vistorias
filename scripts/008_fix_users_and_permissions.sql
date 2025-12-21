-- 1. Desabilitar RLS na tabela users para garantir que a lista apareça
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Sincronizar o usuário admin do auth.users para public.users
INSERT INTO public.users (id, email, full_name, role)
SELECT id, email, 'Robson Alexandre', 'admin'
FROM auth.users
WHERE email = 'admin@bardoportugues.com'
ON CONFLICT (id) DO UPDATE
SET full_name = 'Robson Alexandre',
    role = 'admin';

-- 3. Sincronizar quaisquer outros usuários que possam estar faltando
INSERT INTO public.users (id, email, full_name, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), 'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
