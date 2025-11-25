-- Tabela de conexões Meta
CREATE TABLE IF NOT EXISTS public.meta_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  account_id VARCHAR(50) NOT NULL,
  account_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'ativa',
  conectado_em TIMESTAMPTZ DEFAULT now(),
  ultima_sincronizacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de métricas (cache)
CREATE TABLE IF NOT EXISTS public.meta_metricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.meta_connections(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  gasto DECIMAL(10,2),
  impressoes INTEGER,
  alcance INTEGER,
  cliques INTEGER,
  ctr DECIMAL(5,4),
  cpc DECIMAL(10,2),
  leads INTEGER,
  custo_lead DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(connection_id, data_referencia)
);

-- Tabela de campanhas (cache)
CREATE TABLE IF NOT EXISTS public.meta_campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.meta_connections(id) ON DELETE CASCADE,
  campaign_id VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  status VARCHAR(20),
  objetivo VARCHAR(50),
  gasto DECIMAL(10,2),
  impressoes INTEGER,
  cliques INTEGER,
  leads INTEGER,
  custo_lead DECIMAL(10,2),
  ctr DECIMAL(5,4),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(connection_id, campaign_id)
);

-- Configurações de relatórios automáticos
CREATE TABLE IF NOT EXISTS public.meta_relatorios_auto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.meta_connections(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  frequencia VARCHAR(20) NOT NULL,
  dia_semana INTEGER,
  dia_mes INTEGER,
  horario TIME NOT NULL,
  destinatarios TEXT[] NOT NULL,
  assunto VARCHAR(255),
  mensagem TEXT,
  formato VARCHAR(10) DEFAULT 'pdf',
  proximo_envio TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico de envios
CREATE TABLE IF NOT EXISTS public.meta_envios_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_config_id UUID REFERENCES public.meta_relatorios_auto(id) ON DELETE CASCADE,
  data_envio TIMESTAMPTZ DEFAULT now(),
  status VARCHAR(20),
  destinatarios TEXT[],
  periodo_inicio DATE,
  periodo_fim DATE,
  erro_mensagem TEXT
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_meta_metricas_connection ON public.meta_metricas(connection_id);
CREATE INDEX IF NOT EXISTS idx_meta_metricas_data ON public.meta_metricas(data_referencia);
CREATE INDEX IF NOT EXISTS idx_meta_campanhas_connection ON public.meta_campanhas(connection_id);

-- RLS Policies
ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_metricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_relatorios_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_envios_historico ENABLE ROW LEVEL SECURITY;

-- Policies: Authenticated users can manage all meta tables
CREATE POLICY "Authenticated users can manage meta_connections" 
ON public.meta_connections FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage meta_metricas" 
ON public.meta_metricas FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage meta_campanhas" 
ON public.meta_campanhas FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage meta_relatorios_auto" 
ON public.meta_relatorios_auto FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage meta_envios_historico" 
ON public.meta_envios_historico FOR ALL 
USING (true) WITH CHECK (true);