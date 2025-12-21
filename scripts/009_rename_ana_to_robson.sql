-- Este script procura por usuários com nome "Ana" e atualiza para "Robson Alexandre"
-- Útil se você criou a conta com outro nome e quer corrigir

UPDATE public.users
SET full_name = 'Robson Alexandre'
WHERE full_name ILIKE '%Ana%' OR email ILIKE '%ana%';

-- Garante novamente que o admin também seja Robson Alexandre
UPDATE public.users
SET full_name = 'Robson Alexandre'
WHERE email = 'admin@bardoportugues.com';
