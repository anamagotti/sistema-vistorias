-- Script específico para tornar analuisamagotti@gmail.com administrador

DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 1. Buscar o ID do usuário pelo email na tabela de autenticação
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'analuisamagotti@gmail.com';

  -- 2. Se o usuário existir, atualizar ou criar na tabela pública
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (target_user_id, 'analuisamagotti@gmail.com', 'Ana Luisa', 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin';
    
    RAISE NOTICE 'Sucesso: O usuário analuisamagotti@gmail.com agora é admin.';
  ELSE
    RAISE NOTICE 'Erro: Usuário não encontrado. Faça login/cadastro primeiro.';
  END IF;
END $$;
