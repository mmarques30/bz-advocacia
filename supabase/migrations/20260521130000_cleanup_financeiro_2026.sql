-- =====================================================================
-- Limpeza do financeiro de 2026
-- =====================================================================
-- Objetivo: zerar todos os graficos do modulo financeiro referentes a
-- 2026, para que a Mariana lance os dados manualmente.
--
-- Escopo (recomendado, decidido em conversa):
--   - transacoes_financeiras com ano = 2026
--   - despesas com data em 2026-01-01..2026-12-31
--   - parcelas_financeiras com data_vencimento em 2026 (e seu historico_pagamentos)
--   - acordos_financeiros criados em 2026 (created_at)
--   - creditos_condicionais criados em 2026 (created_at)
--   - metas_mensais com ano = 2026
--
-- Mantem intactos: acordos/parcelas/despesas/transacoes anteriores a
-- 2026. Tabelas de configuracao (categorias, subcategorias,
-- tipos_transacao, despesas_fixas) nao sao alteradas.
--
-- Execucao: roda dentro de uma transacao. Se algo der errado, da
-- ROLLBACK manualmente. Os RAISE NOTICE no final mostram quantas
-- linhas foram apagadas em cada tabela.
-- =====================================================================

BEGIN;

-- 1. historico_pagamentos: parcelas que vencem em 2026
WITH parcelas_2026 AS (
  SELECT id FROM public.parcelas_financeiras
  WHERE data_vencimento >= '2026-01-01' AND data_vencimento < '2027-01-01'
),
del AS (
  DELETE FROM public.historico_pagamentos
  WHERE parcela_id IN (SELECT id FROM parcelas_2026)
  RETURNING 1
)
SELECT count(*) AS historico_pagamentos_deletados FROM del;

-- 2. parcelas_financeiras com vencimento em 2026
WITH del AS (
  DELETE FROM public.parcelas_financeiras
  WHERE data_vencimento >= '2026-01-01' AND data_vencimento < '2027-01-01'
  RETURNING 1
)
SELECT count(*) AS parcelas_deletadas FROM del;

-- 3. acordos_financeiros criados em 2026.
--    Parcelas-filhas remanescentes desses acordos (ex: que vencem em
--    2027) tambem sao apagadas, pois um acordo nao deve sobreviver sem
--    suas parcelas. Apaga historico delas tambem.
WITH acordos_2026 AS (
  SELECT id FROM public.acordos_financeiros
  WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'
),
hist_del AS (
  DELETE FROM public.historico_pagamentos
  WHERE parcela_id IN (
    SELECT id FROM public.parcelas_financeiras
    WHERE acordo_id IN (SELECT id FROM acordos_2026)
  )
  RETURNING 1
),
parc_del AS (
  DELETE FROM public.parcelas_financeiras
  WHERE acordo_id IN (SELECT id FROM acordos_2026)
  RETURNING 1
),
acordo_del AS (
  DELETE FROM public.acordos_financeiros
  WHERE id IN (SELECT id FROM acordos_2026)
  RETURNING 1
)
SELECT
  (SELECT count(*) FROM hist_del)   AS historico_extra_deletado,
  (SELECT count(*) FROM parc_del)   AS parcelas_extra_deletadas,
  (SELECT count(*) FROM acordo_del) AS acordos_deletados;

-- 4. creditos_condicionais criados em 2026
WITH del AS (
  DELETE FROM public.creditos_condicionais
  WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'
  RETURNING 1
)
SELECT count(*) AS creditos_deletados FROM del;

-- 5. despesas com data em 2026
WITH del AS (
  DELETE FROM public.despesas
  WHERE data >= '2026-01-01' AND data < '2027-01-01'
  RETURNING 1
)
SELECT count(*) AS despesas_deletadas FROM del;

-- 6. transacoes_financeiras com ano = 2026
WITH del AS (
  DELETE FROM public.transacoes_financeiras
  WHERE ano = 2026
  RETURNING 1
)
SELECT count(*) AS transacoes_deletadas FROM del;

-- 7. metas_mensais de 2026
WITH del AS (
  DELETE FROM public.metas_mensais
  WHERE ano = 2026
  RETURNING 1
)
SELECT count(*) AS metas_deletadas FROM del;

-- Confere que sobrou zero de cada coisa em 2026:
SELECT
  (SELECT count(*) FROM public.transacoes_financeiras WHERE ano = 2026)                                                                                             AS transacoes_2026_remanescentes,
  (SELECT count(*) FROM public.despesas WHERE data >= '2026-01-01' AND data < '2027-01-01')                                                                         AS despesas_2026_remanescentes,
  (SELECT count(*) FROM public.parcelas_financeiras WHERE data_vencimento >= '2026-01-01' AND data_vencimento < '2027-01-01')                                       AS parcelas_2026_remanescentes,
  (SELECT count(*) FROM public.acordos_financeiros WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01')                                                  AS acordos_2026_remanescentes,
  (SELECT count(*) FROM public.creditos_condicionais WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01')                                                AS creditos_2026_remanescentes,
  (SELECT count(*) FROM public.metas_mensais WHERE ano = 2026)                                                                                                       AS metas_2026_remanescentes;

COMMIT;
-- Se algo deu errado, rode: ROLLBACK;
