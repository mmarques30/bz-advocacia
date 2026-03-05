
CREATE TABLE public.atualizacoes_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo text NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  conteudo text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atualizacoes_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read atualizacoes"
  ON public.atualizacoes_sistema FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert atualizacoes"
  ON public.atualizacoes_sistema FOR INSERT TO authenticated
  WITH CHECK (true);
