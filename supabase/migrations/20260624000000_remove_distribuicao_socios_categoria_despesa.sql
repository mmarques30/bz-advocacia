-- Remove entradas duplicadas de "Distribuicao de socios/socias" do
-- select de categoria_despesa. A modalidade Distribuicao Socias tem
-- fluxo proprio (aba dedicada em Financeiro + RPC get_distribuicao_socia)
-- e nao deve aparecer como categoria de despesa comum, senao lancamentos
-- de despesa cairiam em fluxo divergente da conciliacao de socias.
--
-- Feature request: remover essa entrada apenas do modulo Financeiro
-- (nao apagar da tabela por completo — o dado pode ter uso legado).
--
-- Estrategia: soft-delete via ativo=false. Cobre valores/labels que
-- contenham "distribuic" ou "soci" no grupo categoria_despesa. Idempotente.

UPDATE public.opcoes_sistema
SET ativo = false
WHERE grupo = 'categoria_despesa'
  AND (
    lower(valor) LIKE '%distribuic%'
    OR lower(valor) LIKE '%soci%'
    OR lower(label) LIKE '%distribui%soci%'
    OR lower(label) LIKE '%distribuicao%soci%'
  );

NOTIFY pgrst, 'reload schema';
