-- =====================================================
-- SISTEMA DE NOTIFICAÇÕES WHATSAPP PARA CLIENTES
-- Fase 1 - MVP
-- =====================================================

-- 1. Configuração WhatsApp Business API (multi-provider)
CREATE TABLE whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('meta', 'twilio', 'zenvia')),
  phone_number VARCHAR(20) NOT NULL,
  phone_number_id VARCHAR(100), -- Para Meta Cloud API
  credentials JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT false,
  webhook_verify_token VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Templates de Notificação WhatsApp
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('andamento', 'audiencia', 'sentenca', 'geral', 'cobranca', 'documento', 'prazo')),
  mensagem TEXT NOT NULL,
  variaveis TEXT[] DEFAULT ARRAY[]::TEXT[],
  ativo BOOLEAN DEFAULT true,
  total_envios INTEGER DEFAULT 0,
  usado_ultima_vez TIMESTAMP WITH TIME ZONE,
  criado_por UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Regras de Envio Automático
CREATE TABLE whatsapp_regras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  ativa BOOLEAN DEFAULT true,
  
  -- Gatilho
  tipo_gatilho VARCHAR(20) NOT NULL CHECK (tipo_gatilho IN ('evento', 'agendamento', 'periodicidade')),
  evento_gatilho VARCHAR(50),
  agendamento JSONB,
  periodicidade JSONB,
  
  -- Condições
  condicoes JSONB DEFAULT '{}',
  
  -- Template e destinatários
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  destinatarios VARCHAR(20) NOT NULL CHECK (destinatarios IN ('cliente', 'advogado', 'equipe', 'personalizado')),
  lista_destinatarios TEXT[],
  
  -- Configurações
  intervalo_minimo INTEGER DEFAULT 24, -- em horas
  horario_comercial BOOLEAN DEFAULT false,
  ignorar_fim_semana BOOLEAN DEFAULT false,
  requer_aprovacao BOOLEAN DEFAULT false,
  
  -- Lembretes adicionais
  lembretes JSONB DEFAULT '[]',
  
  -- Estatísticas
  total_envios INTEGER DEFAULT 0,
  ultima_execucao TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Histórico de Notificações Enviadas
CREATE TABLE whatsapp_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Origem
  regra_id UUID REFERENCES whatsapp_regras(id) ON DELETE SET NULL,
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  processo_id UUID REFERENCES processos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES contact_submissions(id) ON DELETE CASCADE,
  
  -- Destinatário
  destinatario_nome VARCHAR(255),
  destinatario_telefone VARCHAR(20) NOT NULL,
  
  -- Mensagem
  mensagem TEXT NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'enviado', 'entregue', 'lido', 'falhou', 'rejeitado')),
  provider VARCHAR(20),
  message_id_externo VARCHAR(100),
  erro_mensagem TEXT,
  
  -- Datas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  aprovado_em TIMESTAMP WITH TIME ZONE,
  enviado_em TIMESTAMP WITH TIME ZONE,
  entregue_em TIMESTAMP WITH TIME ZONE,
  lido_em TIMESTAMP WITH TIME ZONE,
  
  -- Resposta do cliente
  cliente_respondeu BOOLEAN DEFAULT false,
  resposta_cliente TEXT,
  resposta_em TIMESTAMP WITH TIME ZONE,
  
  -- Custo e aprovação
  custo DECIMAL(10,4),
  aprovado_por UUID REFERENCES profiles(id)
);

-- 5. Fila de Aprovação Manual
CREATE TABLE whatsapp_aprovacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historico_id UUID REFERENCES whatsapp_historico(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  aprovado_por UUID REFERENCES profiles(id),
  aprovado_em TIMESTAMP WITH TIME ZONE,
  rejeitado BOOLEAN DEFAULT false,
  motivo_rejeicao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_whatsapp_hist_processo ON whatsapp_historico(processo_id);
CREATE INDEX idx_whatsapp_hist_cliente ON whatsapp_historico(cliente_id);
CREATE INDEX idx_whatsapp_hist_status ON whatsapp_historico(status);
CREATE INDEX idx_whatsapp_hist_created ON whatsapp_historico(created_at DESC);
CREATE INDEX idx_whatsapp_templates_categoria ON whatsapp_templates(categoria);
CREATE INDEX idx_whatsapp_templates_ativo ON whatsapp_templates(ativo);
CREATE INDEX idx_whatsapp_regras_ativa ON whatsapp_regras(ativa);
CREATE INDEX idx_whatsapp_aprovacao_status ON whatsapp_aprovacao(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- whatsapp_config: Apenas admins gerenciam, todos podem ler
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar config WhatsApp"
  ON whatsapp_config FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários autenticados podem ver config WhatsApp"
  ON whatsapp_config FOR SELECT
  USING (true);

-- whatsapp_templates: Criador ou admin pode editar, todos podem ler ativos
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem criar templates"
  ON whatsapp_templates FOR INSERT
  WITH CHECK (criado_por = auth.uid());

CREATE POLICY "Todos podem ler templates ativos"
  ON whatsapp_templates FOR SELECT
  USING (ativo = true OR criado_por = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Criador ou admin pode editar templates"
  ON whatsapp_templates FOR UPDATE
  USING (criado_por = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Criador ou admin pode deletar templates"
  ON whatsapp_templates FOR DELETE
  USING (criado_por = auth.uid() OR has_role(auth.uid(), 'admin'));

-- whatsapp_regras: Apenas admins gerenciam
ALTER TABLE whatsapp_regras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar regras"
  ON whatsapp_regras FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários autenticados podem ver regras"
  ON whatsapp_regras FOR SELECT
  USING (true);

-- whatsapp_historico: Todos autenticados podem ver
ALTER TABLE whatsapp_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem inserir histórico"
  ON whatsapp_historico FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ver histórico"
  ON whatsapp_historico FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode atualizar histórico"
  ON whatsapp_historico FOR UPDATE
  USING (true);

-- whatsapp_aprovacao: Admins gerenciam fila
ALTER TABLE whatsapp_aprovacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar aprovações"
  ON whatsapp_aprovacao FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários autenticados podem ver aprovações"
  ON whatsapp_aprovacao FOR SELECT
  USING (true);

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_regras_updated_at
  BEFORE UPDATE ON whatsapp_regras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TEMPLATES PADRÃO (7 templates pré-configurados)
-- =====================================================

INSERT INTO whatsapp_templates (nome, categoria, mensagem, variaveis, ativo) VALUES
('Novo Andamento Processual', 'andamento', 
'Olá {{nome_cliente}},

Houve uma atualização no seu processo:
{{numero_processo}} - {{tipo_processo}}

NOVO ANDAMENTO:
{{descricao_andamento}}

Data: {{data_andamento}}

Qualquer dúvida, estamos à disposição.

Atenciosamente,
Equipe {{nome_escritorio}}',
ARRAY['nome_cliente', 'numero_processo', 'tipo_processo', 'descricao_andamento', 'data_andamento', 'nome_escritorio'],
true),

('Audiência Agendada', 'audiencia',
'Olá {{nome_cliente}},

ATENÇÃO: Audiência agendada!

Processo: {{numero_processo}}
Data: {{data_audiencia}}
Horário: {{hora_audiencia}}
Local: {{local_audiencia}}

Importante:
• Chegue 30 minutos antes
• Traga documento com foto
• Vista-se formalmente

Entraremos em contato para preparação.

Equipe {{nome_escritorio}}',
ARRAY['nome_cliente', 'numero_processo', 'data_audiencia', 'hora_audiencia', 'local_audiencia', 'nome_escritorio'],
true),

('Lembrete de Audiência - 7 dias', 'audiencia',
'Olá {{nome_cliente}},

Lembrete: Sua audiência está próxima!

Data: {{data_audiencia}}
Horário: {{hora_audiencia}}
Faltam 7 dias!

Já estamos preparando tudo.

Equipe {{nome_escritorio}}',
ARRAY['nome_cliente', 'data_audiencia', 'hora_audiencia', 'nome_escritorio'],
true),

('Lembrete de Audiência - 1 dia', 'audiencia',
'Olá {{nome_cliente}},

AMANHÃ é sua audiência!

Horário: {{hora_audiencia}}
Local: {{local_audiencia}}

Lembre-se:
• Chegue 30 minutos antes
• Traga documento com foto

Qualquer dúvida, entre em contato!

Equipe {{nome_escritorio}}',
ARRAY['nome_cliente', 'hora_audiencia', 'local_audiencia', 'nome_escritorio'],
true),

('Sentença Publicada', 'sentenca',
'Olá {{nome_cliente}},

A sentença do seu processo foi publicada!

Processo: {{numero_processo}}
Resultado: {{resultado_sentenca}}

Entraremos em contato em breve para explicar os próximos passos.

Equipe {{nome_escritorio}}',
ARRAY['nome_cliente', 'numero_processo', 'resultado_sentenca', 'nome_escritorio'],
true),

('Documento Disponível', 'documento',
'Olá {{nome_cliente}},

Novo documento disponível no seu processo:

{{nome_documento}}
Tipo: {{tipo_documento}}

Acesse o sistema ou entre em contato para mais informações.

Equipe {{nome_escritorio}}',
ARRAY['nome_cliente', 'nome_documento', 'tipo_documento', 'nome_escritorio'],
true),

('Prazo Vencendo', 'prazo',
'Olá {{nome_cliente}},

ATENÇÃO: Prazo importante vencendo!

Processo: {{numero_processo}}
Prazo: {{descricao_prazo}}
Vencimento: {{data_prazo}}

Já estamos cuidando. Qualquer dúvida, entre em contato.

Equipe {{nome_escritorio}}',
ARRAY['nome_cliente', 'numero_processo', 'descricao_prazo', 'data_prazo', 'nome_escritorio'],
true);