-- ============================================
-- 1. CONFIGURAÇÕES DO ESCRITÓRIO
-- ============================================
CREATE TABLE IF NOT EXISTS public.configuracoes_escritorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_escritorio text NOT NULL,
  cnpj text,
  oab_principal text,
  telefone text,
  email text,
  endereco_completo text,
  cidade text,
  estado text,
  cep text,
  logo_url text,
  site text,
  redes_sociais jsonb DEFAULT '{}',
  preferencias jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.configuracoes_escritorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler configurações"
  ON public.configuracoes_escritorio FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admins podem modificar"
  ON public.configuracoes_escritorio FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================
-- 2. TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('documento', 'email', 'whatsapp', 'contrato')),
  categoria text,
  conteudo text NOT NULL,
  variaveis text[] DEFAULT ARRAY[]::text[],
  descricao text,
  ativo boolean DEFAULT true,
  criado_por uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler templates"
  ON public.templates FOR SELECT
  TO authenticated
  USING (ativo = true OR criado_por = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem criar templates"
  ON public.templates FOR INSERT
  TO authenticated
  WITH CHECK (criado_por = auth.uid());

CREATE POLICY "Criador ou admin pode editar"
  ON public.templates FOR UPDATE
  TO authenticated
  USING (criado_por = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Criador ou admin pode deletar"
  ON public.templates FOR DELETE
  TO authenticated
  USING (criado_por = auth.uid() OR has_role(auth.uid(), 'admin'));

-- ============================================
-- 3. TAGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  cor text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('lead', 'processo', 'geral')),
  descricao text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entidade_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
  entidade_id uuid NOT NULL,
  entidade_tipo text NOT NULL CHECK (entidade_tipo IN ('lead', 'processo')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(tag_id, entidade_id, entidade_tipo)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidade_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler tags"
  ON public.tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem criar tags"
  ON public.tags FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Criador ou admin pode editar tags"
  ON public.tags FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Criador ou admin pode deletar tags"
  ON public.tags FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Todos podem ler entidade_tags"
  ON public.entidade_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem gerenciar entidade_tags"
  ON public.entidade_tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. LOGS DO SISTEMA
-- ============================================
CREATE TABLE IF NOT EXISTS public.logs_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES auth.users(id),
  acao text NOT NULL,
  entidade_tipo text NOT NULL,
  entidade_id uuid,
  descricao text NOT NULL,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_usuario ON public.logs_sistema(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs_sistema(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_entidade ON public.logs_sistema(entidade_tipo, entidade_id);

ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ler todos os logs"
  ON public.logs_sistema FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema pode inserir logs"
  ON public.logs_sistema FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- FUNÇÃO E TRIGGERS PARA LOG AUTOMÁTICO
-- ============================================
CREATE OR REPLACE FUNCTION public.log_acao()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.logs_sistema (
      usuario_id, acao, entidade_tipo, entidade_id, descricao, metadata
    ) VALUES (
      auth.uid(),
      'criar',
      TG_TABLE_NAME,
      NEW.id,
      'Criou ' || TG_TABLE_NAME || ' #' || NEW.id::text,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.logs_sistema (
      usuario_id, acao, entidade_tipo, entidade_id, descricao, metadata
    ) VALUES (
      auth.uid(),
      'editar',
      TG_TABLE_NAME,
      NEW.id,
      'Editou ' || TG_TABLE_NAME || ' #' || NEW.id::text,
      jsonb_build_object('antes', to_jsonb(OLD), 'depois', to_jsonb(NEW))
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.logs_sistema (
      usuario_id, acao, entidade_tipo, entidade_id, descricao, metadata
    ) VALUES (
      auth.uid(),
      'deletar',
      TG_TABLE_NAME,
      OLD.id,
      'Deletou ' || TG_TABLE_NAME || ' #' || OLD.id::text,
      to_jsonb(OLD)
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers para auditoria automática
CREATE TRIGGER trigger_log_contact_submissions
  AFTER INSERT OR UPDATE OR DELETE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.log_acao();

CREATE TRIGGER trigger_log_processos
  AFTER INSERT OR UPDATE OR DELETE ON public.processos
  FOR EACH ROW EXECUTE FUNCTION public.log_acao();

CREATE TRIGGER trigger_log_acordos
  AFTER INSERT OR UPDATE OR DELETE ON public.acordos_financeiros
  FOR EACH ROW EXECUTE FUNCTION public.log_acao();

-- Inserir configuração padrão do escritório
INSERT INTO public.configuracoes_escritorio (nome_escritorio, email)
VALUES ('Meu Escritório', 'contato@escritorio.com')
ON CONFLICT DO NOTHING;