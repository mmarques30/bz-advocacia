
-- Tabela de modelos de despesas fixas
CREATE TABLE public.despesas_fixas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric NOT NULL,
  categoria text NOT NULL,
  conta text DEFAULT 'escritorio',
  dia_vencimento integer NOT NULL DEFAULT 10,
  ativa boolean DEFAULT true,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

-- RLS
ALTER TABLE public.despesas_fixas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage despesas_fixas"
ON public.despesas_fixas FOR ALL
USING (true)
WITH CHECK (true);

-- Adicionar coluna de vinculo na tabela despesas
ALTER TABLE public.despesas ADD COLUMN despesa_fixa_id uuid REFERENCES public.despesas_fixas(id);
