CREATE TABLE IF NOT EXISTS public.backlog_triagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motivo text NOT NULL CHECK (motivo IN ('cliente_em_atendimento','contato_em_andamento','processo_ativo','duvida_classificacao')),
  telefone text NOT NULL,
  telefone_digits text NOT NULL,
  nome_capturado text,
  msg_recebida text NOT NULL,
  lead_existente_id text,
  contact_submission_id uuid REFERENCES public.contact_submissions(id) ON DELETE SET NULL,
  processo_id uuid,
  resolvido boolean NOT NULL DEFAULT false,
  resolvido_em timestamptz,
  resolvido_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backlog_triagem_resolvido_created
  ON public.backlog_triagem (resolvido, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backlog_triagem_telefone_digits
  ON public.backlog_triagem (telefone_digits);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.backlog_triagem TO authenticated;
GRANT ALL ON public.backlog_triagem TO service_role;

ALTER TABLE public.backlog_triagem ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backlog_triagem_select_auth"
  ON public.backlog_triagem FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "backlog_triagem_update_auth"
  ON public.backlog_triagem FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "backlog_triagem_insert_auth"
  ON public.backlog_triagem FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "backlog_triagem_delete_admin"
  ON public.backlog_triagem FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.backlog_triagem;