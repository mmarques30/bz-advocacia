UPDATE public.leads_geral
SET status_sdr = 'assumido_humano', bot_pausado = true
WHERE etapa_qualificacao = 'M0'
  AND status_sdr = 'em_atendimento_bot'
  AND (
    SELECT COUNT(*) FROM public.mensagens_sdr
    WHERE lead_id = leads_geral.id AND origem = 'lead'
  ) >= 3;