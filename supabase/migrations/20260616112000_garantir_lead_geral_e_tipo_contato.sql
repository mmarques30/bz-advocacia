-- 1) RPC garantir_lead_geral_para_contact:
--    Cria um leads_geral pra um contact_submissions que ainda nao tem
--    vinculo. Usado pelos botoes "Enviar parabens" (aniversariantes) e
--    icone WhatsApp (tabela de clientes) — antes esses davam toast
--    avisando que nao da pra abrir; agora abrem direto.
--
--    Retorna o lead_geral_id existente ou recem-criado. Idempotente:
--    se o contact_submissions ja esta vinculado, so retorna.

CREATE OR REPLACE FUNCTION public.garantir_lead_geral_para_contact(
  p_contact_submission_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_geral_id text;
  v_cs record;
  v_novo_id text;
BEGIN
  -- Pega o contact_submissions
  SELECT id, nome_completo, telefone, lead_geral_id
  INTO v_cs
  FROM public.contact_submissions
  WHERE id = p_contact_submission_id;

  IF v_cs IS NULL THEN
    RAISE EXCEPTION 'contact_submission % nao encontrado', p_contact_submission_id;
  END IF;

  -- Ja vinculado? retorna o id existente.
  IF v_cs.lead_geral_id IS NOT NULL THEN
    RETURN v_cs.lead_geral_id;
  END IF;

  -- Cria um novo leads_geral, status 'assumido_humano' (humano da B&Z
  -- esta iniciando a conversa). bot_pausado=true pra ele nao tentar
  -- conduzir uma conversa que comecou no painel manual.
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

  -- Vincula no contact_submissions
  UPDATE public.contact_submissions
  SET lead_geral_id = v_novo_id,
      data_ultima_atividade = now()
  WHERE id = p_contact_submission_id;

  RETURN v_novo_id;
END;
$$;

REVOKE ALL ON FUNCTION public.garantir_lead_geral_para_contact(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.garantir_lead_geral_para_contact(uuid) TO authenticated;

COMMENT ON FUNCTION public.garantir_lead_geral_para_contact(uuid) IS
  'Garante que um contact_submissions tem lead_geral_id. Cria um vazio (assumido_humano, bot_pausado) se nao tiver. Usado pelos botoes "abrir atendimento" no painel.';

-- 2) Coluna tipo_contato em leads_geral
--    Pra marcar leads que nao sao prospects: fornecedor, parceiro,
--    institucional (vara, cartorio), pessoal. Esses ficam filtrados
--    do Kanban principal de Leads.

ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS tipo_contato text NOT NULL DEFAULT 'lead'
    CHECK (tipo_contato IN ('lead', 'fornecedor', 'parceiro', 'institucional', 'pessoal'));

CREATE INDEX IF NOT EXISTS ix_leads_geral_tipo_contato
  ON public.leads_geral(tipo_contato) WHERE tipo_contato <> 'lead';

COMMENT ON COLUMN public.leads_geral.tipo_contato IS
  'Classifica o contato. Default lead (entra no funil). Demais valores '
  'sao "nao-leads" (fornecedor, parceiro, vara, contato pessoal) e o '
  'pipeline filtra eles.';
