-- Criar tabela de despesas
CREATE TABLE public.despesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric NOT NULL CHECK (valor > 0),
  data date NOT NULL,
  categoria text NOT NULL,
  processo_id uuid REFERENCES processos(id) ON DELETE SET NULL,
  forma_pagamento text,
  status text DEFAULT 'pendente',
  observacoes text,
  anexo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Adicionar comentários para documentação
COMMENT ON TABLE public.despesas IS 'Registros de despesas do escritório';
COMMENT ON COLUMN public.despesas.categoria IS 'aluguel_condominio, salarios_encargos, honorarios_terceiros, marketing_publicidade, materiais_expediente, telefonia_internet, software_licencas, energia_agua, impostos_taxas, outros';
COMMENT ON COLUMN public.despesas.status IS 'pago, pendente, atrasado';

-- Habilitar RLS
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can manage despesas" 
ON public.despesas 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_despesas_updated_at 
BEFORE UPDATE ON public.despesas
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_despesas_data ON public.despesas(data DESC);
CREATE INDEX idx_despesas_categoria ON public.despesas(categoria);
CREATE INDEX idx_despesas_status ON public.despesas(status);
CREATE INDEX idx_despesas_created_by ON public.despesas(created_by);