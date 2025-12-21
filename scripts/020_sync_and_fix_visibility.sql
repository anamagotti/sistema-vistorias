-- Sincronizar usuário do Auth para a tabela Public se estiver faltando
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name', 
    'admin' -- Já forçamos como admin aqui
FROM auth.users
WHERE email = 'bardoportugues2014@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- Garantir que a política de visualização permite admins verem tudo
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  OR 
  auth.uid() = id -- O próprio usuário sempre pode se ver
);
