-- Cria o bucket de armazenamento para fotos
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir acesso público às fotos (leitura)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'inspection-photos' );

-- Política para permitir upload por usuários autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'inspection-photos' AND auth.role() = 'authenticated' );

-- Política para permitir atualização por usuários autenticados
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'inspection-photos' AND auth.role() = 'authenticated' );
