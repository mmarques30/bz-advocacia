-- =============================================
-- documentos_drive: adicionar cliente_id opcional
--
-- Contexto: hoje DocumentoDrive so tem processo_id. Auditoria mostrou
-- que abrir "Documentos" na ficha do cliente exige saber previamente
-- quais processos ele tem — UX quebrada quando um doc pertence ao
-- cliente mas nao a processo especifico (ex: procuracao geral, RG,
-- comprovantes). Esta migration adiciona cliente_id como FK opcional
-- para documentos_drive, mantendo processo_id como antes (backward
-- compat total — nenhuma row existente e alterada).
--
-- Backfill: para rows com processo_id preenchido, copia
-- processos.lead_id -> documentos_drive.cliente_id. Isso garante que
-- docs linkados a processos ja aparecem na aba Documentos do cliente
-- sem exigir reentrada manual.
--
-- Defensive: to_regclass guards. No-op em schemas que nao tem as
-- tabelas alvo.
-- =============================================

DO $$
BEGIN
  IF to_regclass('public.documentos_drive') IS NULL THEN
    RAISE NOTICE 'Skipping cliente_id em documentos_drive (tabela ausente)';
    RETURN;
  END IF;

  -- 1. Adiciona a coluna se nao existir.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public'
       AND table_name='documentos_drive'
       AND column_name='cliente_id'
  ) THEN
    IF to_regclass('public.contact_submissions') IS NOT NULL THEN
      ALTER TABLE public.documentos_drive
        ADD COLUMN cliente_id uuid REFERENCES public.contact_submissions(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE public.documentos_drive
        ADD COLUMN cliente_id uuid;
    END IF;

    COMMENT ON COLUMN public.documentos_drive.cliente_id IS
      'Cliente direto a que o documento pertence. Opcional — alguns documentos sao vinculados a processo (via processo_id) e herdam o cliente atraves do JOIN. Permite linkar docs que nao pertencem a um processo especifico (RG, procuracao geral, comprovantes).';
  END IF;

  -- 2. Index para acelerar filtro por cliente.
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_documentos_drive_cliente_id
             ON public.documentos_drive(cliente_id)
             WHERE cliente_id IS NOT NULL';

  -- 3. Backfill: para docs que ja tem processo_id, copia o lead_id do
  --    processo como cliente_id. So preenche onde ainda e NULL.
  IF to_regclass('public.processos') IS NOT NULL THEN
    UPDATE public.documentos_drive d
       SET cliente_id = p.lead_id
      FROM public.processos p
     WHERE d.processo_id = p.id
       AND d.cliente_id IS NULL
       AND p.lead_id IS NOT NULL;
  END IF;
END;
$$;
