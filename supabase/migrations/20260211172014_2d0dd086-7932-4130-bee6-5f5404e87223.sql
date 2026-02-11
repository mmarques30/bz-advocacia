
-- Tabela para gerenciar opções de listas suspensas do sistema
CREATE TABLE public.opcoes_sistema (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo TEXT NOT NULL,
  valor TEXT NOT NULL,
  label TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(grupo, valor)
);

-- Enable RLS
ALTER TABLE public.opcoes_sistema ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ler
CREATE POLICY "Authenticated users can read opcoes_sistema"
  ON public.opcoes_sistema FOR SELECT
  USING (true);

-- Somente admins podem modificar
CREATE POLICY "Admins can insert opcoes_sistema"
  ON public.opcoes_sistema FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update opcoes_sistema"
  ON public.opcoes_sistema FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete opcoes_sistema"
  ON public.opcoes_sistema FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed: Origem de Leads
INSERT INTO public.opcoes_sistema (grupo, valor, label, ordem) VALUES
  ('origem_lead', 'google', 'Google', 1),
  ('origem_lead', 'facebook', 'Facebook', 2),
  ('origem_lead', 'instagram', 'Instagram', 3),
  ('origem_lead', 'tiktok', 'TikTok', 4),
  ('origem_lead', 'linkedin', 'LinkedIn', 5),
  ('origem_lead', 'indicacao', 'Indicação', 6),
  ('origem_lead', 'site', 'Site', 7),
  ('origem_lead', 'whatsapp_bot', 'WhatsApp Bot', 8),
  ('origem_lead', 'outro', 'Outro', 9);

-- Seed: Tipo de Processo
INSERT INTO public.opcoes_sistema (grupo, valor, label, ordem) VALUES
  ('tipo_processo', 'divorcio_consensual', 'Divórcio Consensual', 1),
  ('tipo_processo', 'divorcio_litigioso', 'Divórcio Litigioso', 2),
  ('tipo_processo', 'inventario', 'Inventário', 3),
  ('tipo_processo', 'pensao_alimenticia', 'Pensão Alimentícia', 4),
  ('tipo_processo', 'uniao_estavel', 'União Estável', 5),
  ('tipo_processo', 'guarda', 'Guarda', 6),
  ('tipo_processo', 'outro', 'Outro', 7);

-- Seed: Categoria de Despesas
INSERT INTO public.opcoes_sistema (grupo, valor, label, ordem) VALUES
  ('categoria_despesa', 'aluguel_condominio', 'Aluguel e Condomínio', 1),
  ('categoria_despesa', 'salarios_encargos', 'Salários e Encargos', 2),
  ('categoria_despesa', 'honorarios_terceiros', 'Honorários de Terceiros', 3),
  ('categoria_despesa', 'material_escritorio', 'Material de Escritório', 4),
  ('categoria_despesa', 'tecnologia', 'Tecnologia', 5),
  ('categoria_despesa', 'marketing', 'Marketing', 6),
  ('categoria_despesa', 'custas_processuais', 'Custas Processuais', 7),
  ('categoria_despesa', 'impostos_taxas', 'Impostos e Taxas', 8),
  ('categoria_despesa', 'viagens_deslocamentos', 'Viagens e Deslocamentos', 9),
  ('categoria_despesa', 'outros', 'Outros', 10);

-- Seed: Categoria de Tarefas
INSERT INTO public.opcoes_sistema (grupo, valor, label, ordem) VALUES
  ('categoria_tarefa', 'processos', 'Processos', 1),
  ('categoria_tarefa', 'vendas', 'Vendas', 2),
  ('categoria_tarefa', 'pagamentos', 'Pagamentos', 3),
  ('categoria_tarefa', 'administrativo', 'Administrativo', 4),
  ('categoria_tarefa', 'geral', 'Geral', 5);
