
-- Add concluida_em column
ALTER TABLE demandas_internas ADD COLUMN IF NOT EXISTS concluida_em TIMESTAMPTZ;

-- Backfill existing completed tasks
UPDATE demandas_internas 
SET concluida_em = COALESCE(data_conclusao::timestamptz, updated_at)
WHERE status = 'concluido' AND concluida_em IS NULL;

-- Create trigger function
CREATE OR REPLACE FUNCTION set_concluida_em()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluido' AND (OLD.status IS DISTINCT FROM 'concluido') THEN
    NEW.concluida_em = NOW();
  END IF;
  IF OLD.status = 'concluido' AND NEW.status != 'concluido' THEN
    NEW.concluida_em = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_concluida_em ON demandas_internas;
CREATE TRIGGER trigger_set_concluida_em
BEFORE UPDATE ON demandas_internas
FOR EACH ROW
EXECUTE FUNCTION set_concluida_em();
