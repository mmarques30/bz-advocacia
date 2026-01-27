-- Remover o índice único do telefone que está causando conflitos na importação
DROP INDEX IF EXISTS idx_contact_submissions_telefone;

-- Criar índice normal (não único) para performance de busca
CREATE INDEX IF NOT EXISTS idx_contact_submissions_telefone ON contact_submissions(telefone);