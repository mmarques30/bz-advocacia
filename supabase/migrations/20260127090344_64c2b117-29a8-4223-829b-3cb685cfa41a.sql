-- Adicionar novos campos na tabela contact_submissions
ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS pasta_drive_url TEXT;

ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS status_cliente TEXT DEFAULT 'ativo';

ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS estado_civil TEXT;

ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS endereco_completo TEXT;

-- Adicionar novos campos na tabela processos
ALTER TABLE processos 
ADD COLUMN IF NOT EXISTS grau_tribunal TEXT;

ALTER TABLE processos 
ADD COLUMN IF NOT EXISTS instancia TEXT;