-- 1. Restaurar o nome da Ana
-- Atualiza o nome para 'Ana' se o email contiver 'ana' OU se for o admin que renomeamos anteriormente
UPDATE public.users
SET full_name = 'Ana'
WHERE email ILIKE '%ana%' 
   OR (email = 'admin@bardoportugues.com' AND full_name = 'Robson Alexandre');

-- 2. Criar o usuário Robson Alexandre (Inserindo direto no auth.users para disparar o trigger)
DO $$
DECLARE
  new_user_id UUID := uuid_generate_v4();
BEGIN
  -- Verifica se já existe para não duplicar
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'robson@bardoportugues.com') THEN
    
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'robson@bardoportugues.com',
      '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0123456789', -- Senha dummy
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Robson Alexandre"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    
    -- O trigger 003_create_profile_trigger vai rodar automaticamente e criar o usuário na tabela public.users
    
  END IF;
END $$;
