-- Criar bucket para logos do escritório se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('escritorio-logos', 'escritorio-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Logos são públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar logos" ON storage.objects;

-- Política: Todos podem visualizar logos
CREATE POLICY "Logos são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'escritorio-logos');

-- Política: Apenas usuários autenticados podem fazer upload
CREATE POLICY "Usuários autenticados podem fazer upload de logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'escritorio-logos');

-- Política: Apenas usuários autenticados podem atualizar logos
CREATE POLICY "Usuários autenticados podem atualizar logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'escritorio-logos');

-- Política: Apenas usuários autenticados podem deletar logos
CREATE POLICY "Usuários autenticados podem deletar logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'escritorio-logos');