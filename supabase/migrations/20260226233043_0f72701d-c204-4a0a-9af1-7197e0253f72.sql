
-- =============================================
-- 1. TABELA RAW IMUTÁVEL (espelho da planilha)
-- =============================================
CREATE TABLE public.sheet_leads_raw (
  id text PRIMARY KEY,
  full_name text,
  phone_number text,
  created_time timestamptz,
  platform text,
  is_organic boolean DEFAULT false,
  tipo_servico text,
  bem_inventariar text,
  preferencia_contato text,
  contato_whatsapp text,
  campaign_id text,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text,
  ad_name text,
  form_id text,
  form_name text,
  lead_status text,
  is_qualified boolean,
  is_quality boolean,
  is_converted boolean,
  observacoes text,
  raw_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text,
  synced_at timestamptz NOT NULL DEFAULT now()
);

-- Index para buscas por telefone
CREATE INDEX idx_sheet_leads_raw_phone ON public.sheet_leads_raw (phone_number);
CREATE INDEX idx_sheet_leads_raw_platform ON public.sheet_leads_raw (platform);
CREATE INDEX idx_sheet_leads_raw_synced ON public.sheet_leads_raw (synced_at);

-- =============================================
-- 2. RLS: SELECT para autenticados, INSERT público (integração), sem UPDATE/DELETE
-- =============================================
ALTER TABLE public.sheet_leads_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sheet_leads_raw"
  ON public.sheet_leads_raw FOR SELECT
  USING (true);

CREATE POLICY "System can insert sheet_leads_raw"
  ON public.sheet_leads_raw FOR INSERT
  WITH CHECK (true);

-- =============================================
-- 3. TRIGGERS DE BLOQUEIO: impedir UPDATE e DELETE
-- =============================================
CREATE OR REPLACE FUNCTION public.block_update_sheet_leads_raw()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'UPDATE não permitido na tabela sheet_leads_raw. Dados são imutáveis.';
END;
$$;

CREATE OR REPLACE FUNCTION public.block_delete_sheet_leads_raw()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'DELETE não permitido na tabela sheet_leads_raw. Dados são imutáveis.';
END;
$$;

CREATE TRIGGER trigger_block_update_sheet_leads_raw
  BEFORE UPDATE ON public.sheet_leads_raw
  FOR EACH ROW
  EXECUTE FUNCTION public.block_update_sheet_leads_raw();

CREATE TRIGGER trigger_block_delete_sheet_leads_raw
  BEFORE DELETE ON public.sheet_leads_raw
  FOR EACH ROW
  EXECUTE FUNCTION public.block_delete_sheet_leads_raw();

-- =============================================
-- 4. VIEW DE AUDITORIA
-- =============================================
CREATE OR REPLACE VIEW public.vw_auditoria_leads AS
WITH raw_phones AS (
  SELECT 
    id,
    full_name,
    regexp_replace(phone_number, '\D', '', 'g') AS phone_clean,
    phone_number,
    platform,
    created_time,
    synced_at
  FROM public.sheet_leads_raw
),
crm_phones AS (
  SELECT 
    id,
    nome_completo,
    telefone AS phone_clean,
    created_at
  FROM public.contact_submissions
)
-- Leads no RAW sem correspondente no CRM
SELECT 
  'sem_crm' AS tipo_divergencia,
  r.id AS raw_id,
  NULL::uuid AS crm_id,
  r.full_name AS raw_nome,
  NULL AS crm_nome,
  r.phone_number AS raw_telefone,
  NULL AS crm_telefone,
  r.platform,
  r.created_time AS raw_data,
  NULL::timestamptz AS crm_data
FROM raw_phones r
LEFT JOIN crm_phones c ON r.phone_clean = c.phone_clean
WHERE c.id IS NULL

UNION ALL

-- Divergências de nome
SELECT 
  'nome_divergente' AS tipo_divergencia,
  r.id AS raw_id,
  c.id AS crm_id,
  r.full_name AS raw_nome,
  c.nome_completo AS crm_nome,
  r.phone_number AS raw_telefone,
  c.phone_clean AS crm_telefone,
  r.platform,
  r.created_time AS raw_data,
  c.created_at AS crm_data
FROM raw_phones r
JOIN crm_phones c ON r.phone_clean = c.phone_clean
WHERE r.full_name IS DISTINCT FROM c.nome_completo

UNION ALL

-- Telefones duplicados no RAW
SELECT 
  'duplicado_raw' AS tipo_divergencia,
  r.id AS raw_id,
  NULL::uuid AS crm_id,
  r.full_name AS raw_nome,
  NULL AS crm_nome,
  r.phone_number AS raw_telefone,
  NULL AS crm_telefone,
  r.platform,
  r.created_time AS raw_data,
  NULL::timestamptz AS crm_data
FROM raw_phones r
WHERE r.phone_clean IN (
  SELECT phone_clean FROM raw_phones GROUP BY phone_clean HAVING COUNT(*) > 1
);
