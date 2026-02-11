CREATE TABLE public.creditos_condicionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  processo_id uuid,
  descricao text NOT NULL,
  valor numeric NOT NULL,
  conta text DEFAULT 'escritorio',
  evento_gatilho text NOT NULL,
  status text DEFAULT 'backlog',
  data_ativacao date,
  observacoes text,
  acordo_id uuid,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.creditos_condicionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage creditos_condicionais"
ON public.creditos_condicionais FOR ALL
USING (true) WITH CHECK (true);