DELETE FROM public.eventos_sdr
WHERE tipo IN ('raw_payload_debug','webhook_recebido')
  AND created_at < now() - interval '24 hours';