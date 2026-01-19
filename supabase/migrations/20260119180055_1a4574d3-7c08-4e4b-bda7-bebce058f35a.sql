-- Tabela para armazenar metas mensais de receita
CREATE TABLE public.metas_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  valor DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(mes, ano)
);

-- Trigger para validar mes e ano
CREATE OR REPLACE FUNCTION validate_metas_mensais()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mes < 1 OR NEW.mes > 12 THEN
    RAISE EXCEPTION 'Mês deve estar entre 1 e 12';
  END IF;
  IF NEW.ano < 2020 OR NEW.ano > 2100 THEN
    RAISE EXCEPTION 'Ano deve estar entre 2020 e 2100';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_metas_mensais_trigger
BEFORE INSERT OR UPDATE ON public.metas_mensais
FOR EACH ROW
EXECUTE FUNCTION validate_metas_mensais();

-- Habilitar RLS
ALTER TABLE public.metas_mensais ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para usuários autenticados
CREATE POLICY "Authenticated users can read metas"
  ON public.metas_mensais FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert metas"
  ON public.metas_mensais FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update metas"
  ON public.metas_mensais FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete metas"
  ON public.metas_mensais FOR DELETE
  TO authenticated USING (true);