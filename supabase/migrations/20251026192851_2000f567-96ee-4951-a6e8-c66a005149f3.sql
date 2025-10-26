-- Tabela de KPIs (métricas calculadas diariamente)
CREATE TABLE IF NOT EXISTS public.kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL UNIQUE,
  total_leads INTEGER DEFAULT 0,
  taxa_conversao DECIMAL(5,2) DEFAULT 0,
  novos_clientes INTEGER DEFAULT 0,
  processos_ativos INTEGER DEFAULT 0,
  receita_mes DECIMAL(12,2) DEFAULT 0,
  taxa_inadimplencia DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas à tabela existente contact_submissions
ALTER TABLE public.contact_submissions 
  ADD COLUMN IF NOT EXISTS estagio TEXT DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'site',
  ADD COLUMN IF NOT EXISTS valor_proposta DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS data_ultima_atividade TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS responsavel_id UUID;

-- Adicionar constraint ao estagio
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contact_submissions_estagio_check'
  ) THEN
    ALTER TABLE public.contact_submissions 
    ADD CONSTRAINT contact_submissions_estagio_check 
    CHECK (estagio IN ('novo', 'contato', 'analise', 'proposta', 'fechado', 'perdido'));
  END IF;
END $$;

-- Tabela de processos
CREATE TABLE IF NOT EXISTS public.processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.contact_submissions(id) ON DELETE SET NULL,
  numero_processo TEXT,
  tipo TEXT NOT NULL,
  status TEXT DEFAULT 'ativo',
  valor DECIMAL(12,2),
  data_inicio DATE NOT NULL,
  data_ultima_atualizacao DATE,
  prazo_proximo DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar constraint ao status de processos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'processos_status_check'
  ) THEN
    ALTER TABLE public.processos 
    ADD CONSTRAINT processos_status_check 
    CHECK (status IN ('ativo', 'encerrado', 'suspenso'));
  END IF;
END $$;

-- Tabela de receitas/financeiro
CREATE TABLE IF NOT EXISTS public.financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID REFERENCES public.processos(id) ON DELETE CASCADE,
  tipo TEXT,
  valor DECIMAL(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT DEFAULT 'pendente',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar constraints ao financeiro
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'financeiro_tipo_check'
  ) THEN
    ALTER TABLE public.financeiro 
    ADD CONSTRAINT financeiro_tipo_check 
    CHECK (tipo IN ('entrada', 'saida'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'financeiro_status_check'
  ) THEN
    ALTER TABLE public.financeiro 
    ADD CONSTRAINT financeiro_status_check 
    CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado'));
  END IF;
END $$;

-- Tabela de atividades/log
CREATE TABLE IF NOT EXISTS public.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  entidade_tipo TEXT,
  entidade_id UUID,
  descricao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_estagio ON public.contact_submissions(estagio);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_processos_status ON public.processos(status);
CREATE INDEX IF NOT EXISTS idx_financeiro_data_vencimento ON public.financeiro(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_atividades_created_at ON public.atividades(created_at DESC);

-- RLS Policies
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

-- Policies para kpis
DROP POLICY IF EXISTS "Authenticated users can read KPIs" ON public.kpis;
CREATE POLICY "Authenticated users can read KPIs" 
  ON public.kpis FOR SELECT 
  TO authenticated 
  USING (true);

-- Policies para processos
DROP POLICY IF EXISTS "Authenticated users can read processos" ON public.processos;
CREATE POLICY "Authenticated users can read processos" 
  ON public.processos FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert processos" ON public.processos;
CREATE POLICY "Authenticated users can insert processos" 
  ON public.processos FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update processos" ON public.processos;
CREATE POLICY "Authenticated users can update processos" 
  ON public.processos FOR UPDATE 
  TO authenticated 
  USING (true);

-- Policies para financeiro
DROP POLICY IF EXISTS "Authenticated users can read financeiro" ON public.financeiro;
CREATE POLICY "Authenticated users can read financeiro" 
  ON public.financeiro FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert financeiro" ON public.financeiro;
CREATE POLICY "Authenticated users can insert financeiro" 
  ON public.financeiro FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Policies para atividades
DROP POLICY IF EXISTS "Authenticated users can read atividades" ON public.atividades;
CREATE POLICY "Authenticated users can read atividades" 
  ON public.atividades FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert atividades" ON public.atividades;
CREATE POLICY "Authenticated users can insert atividades" 
  ON public.atividades FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = usuario_id);

-- Atualizar RLS da contact_submissions para permitir leitura e atualização autenticada
DROP POLICY IF EXISTS "Authenticated users can read submissions" ON public.contact_submissions;
CREATE POLICY "Authenticated users can read submissions" 
  ON public.contact_submissions FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update submissions" ON public.contact_submissions;
CREATE POLICY "Authenticated users can update submissions" 
  ON public.contact_submissions FOR UPDATE 
  TO authenticated 
  USING (true);