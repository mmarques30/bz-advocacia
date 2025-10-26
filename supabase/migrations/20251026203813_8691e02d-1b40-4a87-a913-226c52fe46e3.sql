-- Adicionar política de DELETE para usuários autenticados
CREATE POLICY "Authenticated users can delete submissions"
ON contact_submissions
FOR DELETE
TO authenticated
USING (true);