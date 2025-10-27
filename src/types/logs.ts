export type LogAcao = 'criar' | 'editar' | 'deletar';

export type EntidadeTipo = 
  | 'contact_submissions'
  | 'processos'
  | 'processos_andamentos'
  | 'processos_documentos'
  | 'processos_prazos'
  | 'acordos_financeiros'
  | 'parcelas_financeiras'
  | 'templates'
  | 'tags'
  | 'profiles'
  | 'user_roles';

export interface LogSistema {
  id: string;
  usuario_id?: string;
  acao: LogAcao;
  entidade_tipo: EntidadeTipo;
  entidade_id?: string;
  descricao: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  usuario?: {
    nome_completo: string;
    email: string;
    avatar_url?: string;
  };
}

export interface LogFilters {
  busca?: string;
  usuario_id?: string;
  acao?: LogAcao[];
  entidade_tipo?: EntidadeTipo[];
  data_inicio?: Date;
  data_fim?: Date;
}

export interface LogStats {
  total_logs: number;
  logs_hoje: number;
  logs_semana: number;
  usuario_mais_ativo?: {
    id: string;
    nome: string;
    count: number;
  };
}
