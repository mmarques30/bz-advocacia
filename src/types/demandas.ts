export type DemandaTipo = 'melhoria' | 'bug' | 'sugestao' | 'tarefa';
export type DemandaPrioridade = 'baixa' | 'media' | 'alta' | 'urgente';
export type DemandaStatus = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
export type DemandaCategoria = 'processos' | 'vendas' | 'pagamentos' | 'administrativo' | 'geral';
/**
 * Legacy chaves de advogada conhecidas no sistema. A coluna no banco e TEXT
 * (sem CHECK constraint), entao aceita valores alem desses — por isso usamos
 * o literal union estendido com `(string & {})` para manter o autocomplete
 * das duas chaves legadas sem bloquear novas advogadas adicionadas via
 * profiles.is_advogada (Fase A+B do refactor).
 *
 * Ver docs/migracao-advogadas-hardcoded.md para o roadmap completo.
 */
export type AdvogadaResponsavelLegacy = 'juliana' | 'liziane';
export type AdvogadaResponsavel = AdvogadaResponsavelLegacy | (string & {});

export interface Demanda {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: DemandaTipo;
  prioridade: DemandaPrioridade;
  status: DemandaStatus;
  categoria: DemandaCategoria;
  advogada_responsavel: AdvogadaResponsavel;
  criado_por: string | null;
  responsavel_id: string | null;
  processo_id: string | null;
  lead_id: string | null;
  data_limite: string | null;
  data_conclusao: string | null;
  concluida_em: string | null;
  parent_id: string | null;
  ordem: number | null;
  created_at: string;
  updated_at: string;
  criador?: { nome_completo: string };
  responsavel?: { nome_completo: string };
  processo?: { numero_processo: string | null; tipo: string };
  lead?: { nome_completo: string };
  subtarefas?: Demanda[];
  subtarefas_count?: number;
  subtarefas_concluidas?: number;
}

export interface DemandasFilters {
  tipo?: string;
  status?: string;
  prioridade?: string;
  categoria?: string;
  advogada_responsavel?: string;
  atrasadas?: boolean;
  search?: string;
  ordenacao?: 'recente' | 'antigo';
}

export const TIPO_LABELS: Record<DemandaTipo, string> = {
  melhoria: 'Melhoria',
  bug: 'Bug',
  sugestao: 'Sugestão',
  tarefa: 'Tarefa',
};

export const STATUS_LABELS: Record<DemandaStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const PRIORIDADE_LABELS: Record<DemandaPrioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const CATEGORIA_LABELS: Record<DemandaCategoria, string> = {
  processos: 'Processos',
  vendas: 'Vendas',
  pagamentos: 'Pagamentos',
  administrativo: 'Administrativo',
  geral: 'Geral',
};

export const ADVOGADA_LABELS: Record<AdvogadaResponsavelLegacy, string> = {
  juliana: 'Juliana Borges',
  liziane: 'Eliziane Taborda',
};
