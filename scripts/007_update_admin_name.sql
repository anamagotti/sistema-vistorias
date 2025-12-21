-- Atualiza o nome do administrador para Robson Alexandre
UPDATE public.users
SET full_name = 'Robson Alexandre'
WHERE email = 'admin@bardoportugues.com';
