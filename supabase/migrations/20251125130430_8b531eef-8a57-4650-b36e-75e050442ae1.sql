-- Configuração da API de consultas
CREATE TABLE consultas_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provedor VARCHAR(50) NOT NULL DEFAULT 'bigdatacorp',
  api_token TEXT,
  ambiente VARCHAR(20) DEFAULT 'sandbox',
  ativo BOOLEAN DEFAULT false,
  creditos_disponiveis INTEGER DEFAULT 0,
  ultima_sincronizacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Registro de consultas realizadas (auditoria LGPD)
CREATE TABLE consultas_realizadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_consulta VARCHAR(50) NOT NULL,
  parametro_busca VARCHAR(255) NOT NULL,
  processo_id UUID REFERENCES processos(id),
  usuario_id UUID NOT NULL,
  motivo VARCHAR(100) NOT NULL,
  justificativa TEXT NOT NULL,
  resultado JSONB,
  status VARCHAR(20) NOT NULL,
  mensagem_erro TEXT,
  custo DECIMAL(10,2) DEFAULT 0,
  id_consulta_externa VARCHAR(100),
  ip_origem VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT consultas_tipo_check CHECK (tipo_consulta IN ('veiculo', 'pessoa', 'imovel', 'certidao')),
  CONSTRAINT consultas_status_check CHECK (status IN ('sucesso', 'erro', 'sem_dados', 'api_nao_configurada'))
);

-- Auditoria de acesso aos resultados
CREATE TABLE consultas_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID REFERENCES consultas_realizadas(id) ON DELETE CASCADE,
  acao VARCHAR(50) NOT NULL,
  usuario_id UUID NOT NULL,
  ip_origem VARCHAR(50),
  detalhes JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT auditoria_acao_check CHECK (acao IN ('visualizacao', 'exportacao', 'compartilhamento'))
);

-- Índices para performance
CREATE INDEX idx_consultas_tipo ON consultas_realizadas(tipo_consulta);
CREATE INDEX idx_consultas_usuario ON consultas_realizadas(usuario_id);
CREATE INDEX idx_consultas_processo ON consultas_realizadas(processo_id);
CREATE INDEX idx_consultas_data ON consultas_realizadas(created_at);
CREATE INDEX idx_consultas_status ON consultas_realizadas(status);
CREATE INDEX idx_auditoria_consulta ON consultas_auditoria(consulta_id);
CREATE INDEX idx_auditoria_usuario ON consultas_auditoria(usuario_id);

-- RLS Policies para consultas_config
ALTER TABLE consultas_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar config"
  ON consultas_config
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem visualizar config"
  ON consultas_config
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies para consultas_realizadas
ALTER TABLE consultas_realizadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem inserir consultas"
  ON consultas_realizadas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver suas consultas"
  ON consultas_realizadas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = usuario_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem ver todas consultas"
  ON consultas_realizadas
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para consultas_auditoria
ALTER TABLE consultas_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sistema pode inserir auditoria"
  ON consultas_auditoria
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins podem ver auditoria"
  ON consultas_auditoria
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_consultas_config_updated_at
  BEFORE UPDATE ON consultas_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();