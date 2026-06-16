-- ====================================================================
-- MIGRATION DEFINITIVA — tipo_contato + garantir_lead_geral_para_contact
--
-- As migrations anteriores (20260616112000, 20260616121500, 20260616122500)
-- nao parecem ter sido aplicadas pelo Lovable runner. O painel continua
-- retornando "Could not find the column/function in the schema cache" pra
-- AMBOS os objetos definidos em 20260616112000.
--
-- Esta versao quebra em statements minimos e idempotentes, sem DO blocks
-- complexos, pra maximizar a chance do runner aplicar tudo. Se mesmo
-- assim falhar, o conteudo desta SQL pode ser colado direto no
-- Supabase Dashboard > SQL Editor (e usuario Mariana tem acesso).
-- ====================================================================

-- 1) Coluna leads_geral.tipo_contato (idempotente).
ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS tipo_contato text NOT NULL DEFAULT 'lead';

-- 2) CHECK constraint (drop+recriar pra forcar atualizacao se enum mudou).
ALTER TABLE public.leads_geral DROP CONSTRAINT IF EXISTS leads_geral_tipo_contato_check;
ALTER TABLE public.leads_geral
  ADD CONSTRAINT leads_geral_tipo_contato_check
  CHECK (tipo_contato IN ('lead', 'fornecedor', 'parceiro', 'institucional', 'pessoal'));

-- 3) Indice parcial pra performance de filtros (idempotente).
CREATE INDEX IF NOT EXISTS ix_leads_geral_tipo_contato
  ON public.leads_geral(tipo_contato) WHERE tipo_contato <> 'lead';

-- 4) Funcao garantir_lead_geral_para_contact — CREATE OR REPLACE,
--    cria leads_geral on-demand pra contact_submissions sem vinculo.
CREATE OR REPLACE FUNCTION public.garantir_lead_geral_para_contact(
  p_contact_submission_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cs record;
  v_novo_id text;
BEGIN
  SELECT id, nome_completo, telefone, lead_geral_id
  INTO v_cs
  FROM public.contact_submissions
  WHERE id = p_contact_submission_id;

  IF v_cs IS NULL THEN
    RAISE EXCEPTION 'contact_submission % nao encontrado', p_contact_submission_id;
  END IF;

  IF v_cs.lead_geral_id IS NOT NULL THEN
    RETURN v_cs.lead_geral_id;
  END IF;

  v_novo_id := 'sdr_wa_' || extract(epoch from now())::bigint || '_' ||
               regexp_replace(coalesce(v_cs.telefone, ''), '\D', '', 'g');

  INSERT INTO public.leads_geral (
    id, full_name, phone_number, contato_whatsapp,
    platform, origem_sdr, status_sdr, etapa_qualificacao,
    is_organic, bot_pausado, assumido_em, created_time
  ) VALUES (
    v_novo_id,
    coalesce(v_cs.nome_completo, 'Cliente'),
    v_cs.telefone,
    v_cs.telefone,
    'whatsapp_organico',
    'humano_iniciou',
    'assumido_humano',
    'M0',
    true,
    true,
    now(),
    now()
  );

  UPDATE public.contact_submissions
  SET lead_geral_id = v_novo_id,
      data_ultima_atividade = now()
  WHERE id = p_contact_submission_id;

  RETURN v_novo_id;
END;
$$;

-- 5) Permissoes da funcao.
REVOKE ALL ON FUNCTION public.garantir_lead_geral_para_contact(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.garantir_lead_geral_para_contact(uuid) TO authenticated;

COMMENT ON FUNCTION public.garantir_lead_geral_para_contact(uuid) IS
  'Garante que um contact_submissions tem lead_geral_id. Cria um vazio (assumido_humano, bot_pausado) se nao tiver. Usado pelos botoes "abrir atendimento" no painel.';

COMMENT ON COLUMN public.leads_geral.tipo_contato IS
  'Classifica o contato. Default lead (entra no funil). Demais valores (fornecedor, parceiro, institucional, pessoal) sao nao-leads e o pipeline filtra eles.';

-- 6) consultas_realizadas: CHECK aceita tipos modernos pra Historico funcionar.
ALTER TABLE public.consultas_realizadas DROP CONSTRAINT IF EXISTS consultas_tipo_check;
ALTER TABLE public.consultas_realizadas DROP CONSTRAINT IF EXISTS consultas_realizadas_tipo_consulta_check;
ALTER TABLE public.consultas_realizadas
  ADD CONSTRAINT consultas_realizadas_tipo_consulta_check
  CHECK (tipo_consulta IN ('cnpj', 'cep', 'cpf', 'processo', 'veiculo', 'pessoa', 'imovel', 'certidao'));

-- 7) Forca PostgREST a recarregar o schema cache.
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
