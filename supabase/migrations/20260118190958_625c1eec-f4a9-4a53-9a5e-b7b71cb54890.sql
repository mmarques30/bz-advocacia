-- Adicionar coluna temporária para conversão segura
ALTER TABLE public.transacoes_financeiras ADD COLUMN IF NOT EXISTS data_transacao_date DATE;

-- Converter datas de texto para DATE, tratando formatos invertidos
UPDATE public.transacoes_financeiras
SET data_transacao_date = CASE 
  -- Null ou vazio: usar primeiro dia do mês/ano
  WHEN data_transacao IS NULL OR data_transacao = '' THEN 
    make_date(ano, mes, 1)
  
  -- Formato YYYY-MM-DD normal (quando mês <= 12)
  WHEN data_transacao ~ '^\d{4}-\d{2}-\d{2}$' 
    AND CAST(SUBSTRING(data_transacao FROM 6 FOR 2) AS INTEGER) <= 12 THEN
    data_transacao::DATE
  
  -- Formato YYYY-DD-MM invertido (quando a parte do "mês" > 12)
  WHEN data_transacao ~ '^\d{4}-\d{2}-\d{2}$' 
    AND CAST(SUBSTRING(data_transacao FROM 6 FOR 2) AS INTEGER) > 12 THEN
    TO_DATE(data_transacao, 'YYYY-DD-MM')
  
  -- Qualquer outro caso: fallback para primeiro dia do mês
  ELSE make_date(ano, mes, 1)
END;

-- Remover a coluna antiga e renomear a nova
ALTER TABLE public.transacoes_financeiras DROP COLUMN data_transacao;
ALTER TABLE public.transacoes_financeiras RENAME COLUMN data_transacao_date TO data_transacao;