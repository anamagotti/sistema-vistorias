-- Tornar o usuário bardoportugues2014@gmail.com administrador
UPDATE public.users
SET role = 'admin'
WHERE email = 'bardoportugues2014@gmail.com';
