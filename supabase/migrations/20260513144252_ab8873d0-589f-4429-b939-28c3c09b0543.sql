-- Espelha em contact_submissions os leads_geral com status_sdr='sql_aguardando_humano'
-- que ainda não têm registro espelho. Sem isso, o painel /dashboard/leads
-- (que lê só de contact_submissions) nunca exibe esses leads quentes.
INSERT INTO public.contact_submissions (
  nome_completo, telefone, email, tipo_processo, como_conheceu, mensagem,
  lgpd_consent, origem, estagio, status, lead_geral_id, whatsapp_id,
  primeiro_contato_em, ultimo_contato_em, data_ultima_atividade
)
SELECT
  COALESCE(lg.full_name, 'Lead WhatsApp'),
  COALESCE(lg.contato_whatsapp, lg.phone_number, ''),
  '',
  CASE
    WHEN lg.area_normalizada IN ('saude','medicamentos_de_alto_custo') THEN 'Saúde'
    WHEN lg.area_normalizada IN ('inventario','sucessoes','sucessões') THEN 'Inventário'
    WHEN lg.area_normalizada = 'familia' THEN 'Família'
    WHEN lg.area_normalizada = 'civel' THEN 'Cível'
    WHEN lg.area_normalizada = 'consumidor' THEN 'Consumidor'
    WHEN lg.area_normalizada = 'trabalhista' THEN 'Trabalhista'
    WHEN lg.area_normalizada = 'previdenciario' THEN 'Previdenciário'
    ELSE 'Outro'
  END,
  'bot',
  'Lead qualificado pelo bot SDR — aguardando atendimento humano',
  true,
  'whatsapp_bot',
  'novo',
  'novo',
  lg.id,
  COALESCE(lg.contato_whatsapp, lg.phone_number),
  now(), now(), now()
FROM public.leads_geral lg
LEFT JOIN public.contact_submissions cs ON cs.lead_geral_id = lg.id
WHERE lg.status_sdr = 'sql_aguardando_humano'
  AND cs.id IS NULL;