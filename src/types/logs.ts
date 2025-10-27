export type LogAcao = 'criar' | 'editar' | 'deletar' | 'login' | 'logout' | 'visualizar';

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
  usuario_nome?: string;
  usuario_email?: string;
  usuario_avatar?: string;
}

export interface LogFilters {
  busca?: string;
  usuario_id?: string;
  acao?: LogAcao[];
  entidade_tipo?: EntidadeTipo[];
  data_inicio?: string;
  data_fim?: string;
}

export interface LogStats {
  total_logs: number;
  logs_hoje: number;
  logs_semana: number;
  usuario_mais_ativo?: {
    usuario_id: string;
    usuario_nome: string;
    count: number;
  };
}

export const ACAO_LABELS: Record<LogAcao, string> = {
  criar: 'Criou',
  editar: 'Editou',
  deletar: 'Deletou',
  login: 'Login',
  logout: 'Logout',
  visualizar: 'Visualizou',
};

export const ENTIDADE_LABELS: Record<EntidadeTipo, string> = {
  contact_submissions: 'Lead',
  processos: 'Processo',
  processos_andamentos: 'Andamento',
  processos_documentos: 'Documento',
  processos_prazos: 'Prazo',
  acordos_financeiros: 'Acordo',
  parcelas_financeiras: 'Parcela',
  templates: 'Template',
  tags: 'Tag',
  profiles: 'Perfil',
  user_roles: 'Permissão',
};
