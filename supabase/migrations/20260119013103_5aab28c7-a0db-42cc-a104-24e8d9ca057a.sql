-- Criar tabela de configuração do Apify
CREATE TABLE public.apify_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_token_configured BOOLEAN DEFAULT false,
  actor_id TEXT DEFAULT 'codsec/consulta-receita-federal-api',
  ativo BOOLEAN DEFAULT true,
  creditos_usados INTEGER DEFAULT 0,
  ultima_consulta TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.apify_config ENABLE ROW LEVEL SECURITY;

-- Policies - apenas admins podem gerenciar
CREATE POLICY "Admins can view apify_config"
ON public.apify_config
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert apify_config"
ON public.apify_config
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update apify_config"
ON public.apify_config
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_apify_config_updated_at
BEFORE UPDATE ON public.apify_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração inicial
INSERT INTO public.apify_config (api_token_configured, ativo)
VALUES (true, true);

-- Adicionar 'cpf' ao tipo de consulta permitido (se existir constraint)
-- A coluna tipo_consulta em consultas_realizadas é TEXT, então não precisa de alteração