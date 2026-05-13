-- Backlog de leads: contatos iniciados por humano da B&Z para telefones desconhecidos.
-- Não viram leads_geral até serem aprovados manualmente no painel.
CREATE TABLE IF NOT EXISTS public.leads_backlog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone text NOT NULL,
  telefone_raw text,
  nome text,
  primeira_mensagem text,
  origem text NOT NULL DEFAULT 'humano_iniciou',
  payload jsonb,
  status text NOT NULL DEFAULT 'pendente', -- pendente | aprovado | rejeitado
  aprovado_por uuid,
  aprovado_em timestamptz,
  rejeitado_motivo text,
  lead_geral_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_backlog_status ON public.leads_backlog(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_backlog_telefone ON public.leads_backlog(telefone);

ALTER TABLE public.leads_backlog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated podem ver backlog"
ON public.leads_backlog FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated podem atualizar backlog"
ON public.leads_backlog FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated podem deletar backlog"
ON public.leads_backlog FOR DELETE TO authenticated
USING (true);

-- Service role insere via edge function. Sem policy de INSERT pra authenticated.

CREATE TRIGGER trg_leads_backlog_updated_at
BEFORE UPDATE ON public.leads_backlog
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.leads_backlog;
ALTER TABLE public.leads_backlog REPLICA IDENTITY FULL;