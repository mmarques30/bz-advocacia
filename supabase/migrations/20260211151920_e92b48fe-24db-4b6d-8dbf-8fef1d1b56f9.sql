ALTER TABLE demandas_internas
  ADD COLUMN advogada_responsavel text NOT NULL DEFAULT 'juliana'
  CHECK (advogada_responsavel IN ('juliana', 'liziane'));