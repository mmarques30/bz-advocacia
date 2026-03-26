export type ProcessoStatus = 'em_andamento' | 'concluido' | 'arquivado' | 'suspenso';
export type TipoAndamento = 'audiencia' | 'decisao' | 'peticao' | 'recurso' | 'sentenca' | 'juntada' | 'despacho' | 'outro';
export type TipoPrazo = 'recurso' | 'contestacao' | 'audiencia' | 'outro';
export type StatusPrazo = 'pendente' | 'cumprido' | 'cancelado';
export type PrazoPrioridade = 'alta' | 'media' | 'baixa';
export type CategoriaDocumento = 'peticao' | 'decisao' | 'prova' | 'parecer' | 'outro';

export interface Processo {
  id: string;
  lead_id: string | null;
  numero_processo: string | null;
  tipo: string;
  status: ProcessoStatus;
  valor: number | null;
  data_inicio: string;
  data_ultima_atualizacao: string | null;
  data_prevista_conclusao: string | null;
  prazo_proximo: string | null;
  tribunal: string | null;
  comarca: string | null;
  vara: string | null;
  responsavel_id: string | null;
  observacoes: string | null;
  data_distribuicao: string | null;
  autor: string | null;
  reu: string | null;
  created_at: string;
  // Novos campos
  grau_tribunal: string | null;
  instancia: string | null;
  pasta_drive_url: string | null;
  extrajudicial: boolean;
  codigo_interno: string | null;
  
  // Relações
  cliente?: {
    id: string;
    nome_completo: string;
    email: string;
    telefone: string;
  };
  andamentos?: ProcessoAndamento[];
  prazos?: ProcessoPrazo[];
  documentos?: ProcessoDocumento[];
  historico?: ProcessoHistorico[];
}

export interface ProcessoAndamento {
  id: string;
  processo_id: string;
  data_andamento: string;
  tipo_andamento: TipoAndamento;
  descricao: string;
  responsavel_id: string | null;
  created_at: string;
  created_by: string | null;
}

export interface ProcessoPrazo {
  id: string;
  processo_id: string;
  descricao: string;
  data_prazo: string;
  tipo_prazo: TipoPrazo;
  status: StatusPrazo;
  responsavel_id: string | null;
  alerta_dias_antes: number;
  prioridade: PrazoPrioridade;
  alerta_7_dias: boolean;
  alerta_3_dias: boolean;
  alerta_1_dia: boolean;
  observacoes: string | null;
  created_at: string;
  created_by: string | null;
  
  // Calculado
  dias_restantes?: number;
  alerta_ativo?: boolean;
}

export interface ProcessoDocumento {
  id: string;
  processo_id: string;
  andamento_id: string | null;
  nome_arquivo: string;
  categoria: CategoriaDocumento;
  caminho_storage: string;
  tamanho_bytes: number;
  mime_type: string;
  created_at: string;
  uploaded_by: string | null;
}

export interface ProcessoHistorico {
  id: string;
  processo_id: string;
  entidade_tipo: string;
  entidade_id: string | null;
  acao: string;
  campo_alterado: string | null;
  valor_anterior: string | null;
  valor_novo: string | null;
  usuario_id: string | null;
  created_at: string;
}

export interface ProcessosFilters {
  search?: string;
  status: ProcessoStatus[];
  tribunal?: string;
  tipo?: string;
  cliente_id?: string;
  responsavel_id?: string;
  tem_prazo_proximo?: boolean;
  sem_atualizacao_dias?: number;
  data_inicio_start?: Date;
  data_inicio_end?: Date;
  filtro_documentos?: 'com_docs' | 'sem_docs';
}

export const PROCESSO_STATUS_LABELS: Record<ProcessoStatus, string> = {
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
  suspenso: 'Suspenso',
};

export const TIPO_ANDAMENTO_LABELS: Record<TipoAndamento, string> = {
  audiencia: 'Audiência',
  decisao: 'Decisão',
  peticao: 'Petição',
  recurso: 'Recurso',
  sentenca: 'Sentença',
  juntada: 'Juntada',
  despacho: 'Despacho',
  outro: 'Outro',
};

export const TIPO_PRAZO_LABELS: Record<TipoPrazo, string> = {
  recurso: 'Recurso',
  contestacao: 'Contestação',
  audiencia: 'Audiência',
  outro: 'Outro',
};

export const PRIORIDADE_LABELS: Record<PrazoPrioridade, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const CATEGORIA_DOCUMENTO_LABELS: Record<CategoriaDocumento, string> = {
  peticao: 'Petição',
  decisao: 'Decisão',
  prova: 'Prova',
  parecer: 'Parecer',
  outro: 'Outro',
};

export const TRIBUNAIS_OPCOES = [
  'TJRS', 'TJSP', 'TJRJ', 'TJMG', 'TJPR', 'TJSC', 'TJBA',
  'TJDF', 'TJGO', 'TJPE', 'TJCE', 'TJPA',
  'JFRS', 'JFSP', 'JFRJ',
  'VT-POA', 'VT-SP',
  'TRF-1', 'TRF-2', 'TRF-3', 'TRF-4', 'TRF-5', 'TRF-6',
  'STJ', 'STF', 'TST', 'TSE',
];

export const GRAU_TRIBUNAL_OPCOES = [
  '1º Grau',
  '2º Grau',
  'Instância Superior',
  'Outros',
];
