-- Tabela para relatórios compartilhados com clientes
CREATE TABLE IF NOT EXISTS public.relatorios_compartilhados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  tipo_relatorio text NOT NULL,
  data_inicio date,
  data_fim date,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.relatorios_compartilhados ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view shared reports"
  ON public.relatorios_compartilhados FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create shared reports"
  ON public.relatorios_compartilhados FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Public access with valid token"
  ON public.relatorios_compartilhados FOR SELECT
  TO anon
  USING (expires_at > now());

-- Index for token lookups
CREATE INDEX idx_relatorios_token ON public.relatorios_compartilhados(token);
CREATE INDEX idx_relatorios_expires ON public.relatorios_compartilhados(expires_at);