-- Create mirror tables for external database data

-- Tabela de transações externas (receitas e despesas)
CREATE TABLE public.transacoes_externas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id uuid,
  ano integer NOT NULL,
  mes integer NOT NULL,
  mes_nome text,
  categoria text NOT NULL,
  subcategoria text,
  tipo text NOT NULL,
  data_transacao date NOT NULL,
  descricao text,
  valor numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de categorias externas
CREATE TABLE public.categorias_externas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id uuid,
  nome text NOT NULL,
  descricao text,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela de subcategorias externas
CREATE TABLE public.subcategorias_externas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id uuid,
  nome text NOT NULL,
  categoria_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela de resumo mensal externo
CREATE TABLE public.resumo_mensal_externo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id uuid,
  ano integer NOT NULL,
  mes integer NOT NULL,
  mes_nome text,
  total_receitas numeric DEFAULT 0,
  total_despesas numeric DEFAULT 0,
  saldo numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela de resumo anual externo
CREATE TABLE public.resumo_anual_externo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id uuid,
  ano integer NOT NULL,
  total_receitas numeric DEFAULT 0,
  total_despesas numeric DEFAULT 0,
  saldo numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela de resumo por subcategoria externo
CREATE TABLE public.resumo_por_subcategoria_externo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id uuid,
  ano integer,
  mes integer,
  subcategoria text,
  tipo text,
  total numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.transacoes_externas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_externas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategorias_externas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumo_mensal_externo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumo_anual_externo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumo_por_subcategoria_externo ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can read transacoes_externas" ON public.transacoes_externas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage transacoes_externas" ON public.transacoes_externas FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read categorias_externas" ON public.categorias_externas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage categorias_externas" ON public.categorias_externas FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read subcategorias_externas" ON public.subcategorias_externas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage subcategorias_externas" ON public.subcategorias_externas FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read resumo_mensal_externo" ON public.resumo_mensal_externo FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage resumo_mensal_externo" ON public.resumo_mensal_externo FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read resumo_anual_externo" ON public.resumo_anual_externo FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage resumo_anual_externo" ON public.resumo_anual_externo FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read resumo_por_subcategoria_externo" ON public.resumo_por_subcategoria_externo FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage resumo_por_subcategoria_externo" ON public.resumo_por_subcategoria_externo FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_transacoes_externas_ano_mes ON public.transacoes_externas(ano, mes);
CREATE INDEX idx_transacoes_externas_tipo ON public.transacoes_externas(tipo);
CREATE INDEX idx_transacoes_externas_categoria ON public.transacoes_externas(categoria);
CREATE INDEX idx_transacoes_externas_subcategoria ON public.transacoes_externas(subcategoria);
CREATE INDEX idx_resumo_mensal_externo_ano ON public.resumo_mensal_externo(ano);