-- Forçar a confirmação do email do usuário para ele entrar direto
UPDATE auth.users
SET email_confirmed_at = timezone('utc', now())
WHERE email = 'bardoportugues2014@gmail.com';
