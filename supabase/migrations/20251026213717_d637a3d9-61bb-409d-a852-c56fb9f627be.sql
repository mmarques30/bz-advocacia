-- Criar tabela de notificacoes
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('novo_lead', 'lead_parado', 'lead_respondeu', 'prazo_proximo', 'parcela_atrasada', 'novo_andamento')),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  link TEXT,
  lida BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar indices
CREATE INDEX idx_notificacoes_usuario ON public.notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX idx_notificacoes_created ON public.notificacoes(created_at DESC);

-- RLS Policies
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notificacoes
  FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can update own notifications"
  ON public.notificacoes
  FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notificacoes
  FOR DELETE
  USING (auth.uid() = usuario_id);

CREATE POLICY "System can insert notifications"
  ON public.notificacoes
  FOR INSERT
  WITH CHECK (true);

-- Funcao para criar notificacoes automaticamente
CREATE OR REPLACE FUNCTION criar_notificacao_novo_lead()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notificacoes (usuario_id, tipo, titulo, descricao, link, metadata)
  VALUES (
    COALESCE(NEW.responsavel_id, (SELECT id FROM auth.users LIMIT 1)),
    'novo_lead',
    'Novo lead recebido',
    NEW.nome_completo || ' - ' || NEW.tipo_processo || ' (via ' || COALESCE(NEW.origem, 'site') || ')',
    '/dashboard/leads?id=' || NEW.id,
    jsonb_build_object('leadId', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar notificacao em novos leads
DROP TRIGGER IF EXISTS trigger_notificacao_novo_lead ON public.contact_submissions;
CREATE TRIGGER trigger_notificacao_novo_lead
  AFTER INSERT ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_novo_lead();