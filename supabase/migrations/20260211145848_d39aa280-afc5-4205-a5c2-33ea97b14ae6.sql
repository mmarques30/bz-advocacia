
-- Remover politicas restritivas
DROP POLICY IF EXISTS "Admins can insert demandas" ON demandas_internas;
DROP POLICY IF EXISTS "Admins can update demandas" ON demandas_internas;
DROP POLICY IF EXISTS "Admins can delete demandas" ON demandas_internas;

-- INSERT: qualquer usuario autenticado
CREATE POLICY "Authenticated users can insert demandas"
  ON demandas_internas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: admins ou o criador ou o responsavel
CREATE POLICY "Users can update own or assigned demandas"
  ON demandas_internas FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR criado_por = auth.uid()
    OR responsavel_id = auth.uid()
  );

-- DELETE: admins ou o criador
CREATE POLICY "Admins or creator can delete demandas"
  ON demandas_internas FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR criado_por = auth.uid()
  );
