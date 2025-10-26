export type ProcessoStatus = 'em_andamento' | 'concluido' | 'arquivado' | 'suspenso';
export type TipoAndamento = 'audiencia' | 'decisao' | 'peticao' | 'recurso' | 'outro';
export type TipoPrazo = 'recurso' | 'contestacao' | 'audiencia' | 'outro';
export type StatusPrazo = 'pendente' | 'cumprido' | 'cancelado';

export interface Processo {
  id: string;
  lead_id: string | null;
  numero_processo: string | null;
  tipo: string;
  status: ProcessoStatus;
  valor: number | null;
  data_inicio: string;
  data_ultima_atualizacao: string | null;
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
  
  // Relações
  cliente?: {
    id: string;
    nome_completo: string;
    email: string;
    telefone: string;
  };
  andamentos?: ProcessoAndamento[];
  prazos?: ProcessoPrazo[];
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
  observacoes: string | null;
  created_at: string;
  created_by: string | null;
  
  // Calculado
  dias_restantes?: number;
  alerta_ativo?: boolean;
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
  outro: 'Outro',
};

export const TIPO_PRAZO_LABELS: Record<TipoPrazo, string> = {
  recurso: 'Recurso',
  contestacao: 'Contestação',
  audiencia: 'Audiência',
  outro: 'Outro',
};

export const TRIBUNAIS_OPCOES = [
  'TJ-SP', 'TJ-RJ', 'TJ-MG', 'TJ-RS', 'TJ-PR', 'TJ-SC', 'TJ-BA',
  'TRF-1', 'TRF-2', 'TRF-3', 'TRF-4', 'TRF-5', 'TRF-6',
  'STJ', 'STF', 'TST', 'TSE',
];
