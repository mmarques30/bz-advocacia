ALTER TABLE demandas_internas
  ADD COLUMN parent_id uuid REFERENCES demandas_internas(id) ON DELETE CASCADE,
  ADD COLUMN ordem integer;

CREATE INDEX idx_demandas_parent ON demandas_internas(parent_id);