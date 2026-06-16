-- 1) consultas_realizadas: CHECK constraint estava restrito a
--    'veiculo','pessoa','imovel','certidao' (criado em 20251125130430),
--    mas a edge function consultas-brasilapi escreve 'cnpj'/'cep'.
--    Resultado: todo INSERT eh rejeitado por violacao de CHECK e o
--    Historico mostra zero consultas. Fix: troca o constraint pelos
--    valores reais usados hoje (cnpj, cep) + os antigos pra nao perder
--    registros legados, + cpf/processo pra quando contratarmos as APIs.

DO $$
BEGIN
  -- Constraint pode ter nome diferente, removemos qualquer um que
  -- restrinja tipo_consulta. So sao alguns possiveis.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'consultas_tipo_check'
      AND conrelid = 'public.consultas_realizadas'::regclass
  ) THEN
    ALTER TABLE public.consultas_realizadas DROP CONSTRAINT consultas_tipo_check;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'consultas_realizadas_tipo_consulta_check'
      AND conrelid = 'public.consultas_realizadas'::regclass
  ) THEN
    ALTER TABLE public.consultas_realizadas DROP CONSTRAINT consultas_realizadas_tipo_consulta_check;
  END IF;
END $$;

ALTER TABLE public.consultas_realizadas
  ADD CONSTRAINT consultas_realizadas_tipo_consulta_check
  CHECK (tipo_consulta IN ('cnpj', 'cep', 'cpf', 'processo', 'veiculo', 'pessoa', 'imovel', 'certidao'));

-- 2) leads_geral.tipo_contato: garante que a coluna existe (a migration
--    20260616121500 ja tentou aplicar; reforco aqui pra ter certeza que
--    o schema cache do PostgREST seja invalidado nesta janela).

ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS tipo_contato text NOT NULL DEFAULT 'lead';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leads_geral_tipo_contato_check'
      AND conrelid = 'public.leads_geral'::regclass
  ) THEN
    ALTER TABLE public.leads_geral
      ADD CONSTRAINT leads_geral_tipo_contato_check
      CHECK (tipo_contato IN ('lead', 'fornecedor', 'parceiro', 'institucional', 'pessoal'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_leads_geral_tipo_contato
  ON public.leads_geral(tipo_contato) WHERE tipo_contato <> 'lead';

-- 3) Forca PostgREST a recarregar o schema cache (sem isso o erro
--    "could not find column in schema cache" persiste mesmo apos o
--    ALTER TABLE).

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
