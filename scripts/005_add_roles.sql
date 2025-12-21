-- Adicionar campo de role na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- Atualizar o trigger para incluir role padrão
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar um usuário admin inicial (você precisará fazer signup com este email)
-- Email: admin@bardoportugues.com
-- Senha: Admin@2024!BP

-- Atualizar RLS policies para permitir apenas admins criar/editar vistorias
DROP POLICY IF EXISTS "Users can insert own inspections" ON inspections;
DROP POLICY IF EXISTS "Users can update own inspections" ON inspections;

CREATE POLICY "Only admins can insert inspections"
  ON inspections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update inspections"
  ON inspections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Permitir que todos vejam vistorias (podem ser restringidas depois se necessário)
DROP POLICY IF EXISTS "Users can view own inspections" ON inspections;
CREATE POLICY "All authenticated users can view inspections"
  ON inspections FOR SELECT
  TO authenticated
  USING (true);

-- Policies para checklist_items (apenas admins podem inserir/atualizar)
DROP POLICY IF EXISTS "Users can insert own checklist items" ON checklist_items;
DROP POLICY IF EXISTS "Users can update own checklist items" ON checklist_items;

CREATE POLICY "Only admins can insert checklist items"
  ON checklist_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update checklist items"
  ON checklist_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "All authenticated users can view checklist items"
  ON checklist_items FOR SELECT
  TO authenticated
  USING (true);

-- Policy para profiles: admins podem ver e atualizar todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());
