-- Remover constraint antiga
ALTER TABLE contact_submissions 
DROP CONSTRAINT IF EXISTS contact_submissions_estagio_check;

-- Adicionar constraint nova com valores corretos
ALTER TABLE contact_submissions 
ADD CONSTRAINT contact_submissions_estagio_check 
CHECK (estagio IN (
  'novo', 
  'contato_inicial', 
  'em_analise', 
  'proposta_enviada', 
  'fechado', 
  'perdido'
));

-- Atualizar registros existentes (se houver com valores antigos)
UPDATE contact_submissions 
SET estagio = CASE 
  WHEN estagio = 'contato' THEN 'contato_inicial'
  WHEN estagio = 'analise' THEN 'em_analise'
  WHEN estagio = 'proposta' THEN 'proposta_enviada'
  ELSE estagio
END
WHERE estagio IN ('contato', 'analise', 'proposta');