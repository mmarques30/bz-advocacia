export type StatusAcordo = 'ativo' | 'concluido' | 'cancelado';
export type FormaPagamento = 'a_vista' | 'parcelado';
export type StatusParcela = 'pendente' | 'pago' | 'atrasado' | 'cancelado';
export type FormaPagamentoRecebido = 'pix' | 'boleto' | 'cartao' | 'dinheiro' | 'transferencia';

export interface AcordoFinanceiro {
  id: string;
  cliente_id: string;
  processo_id: string | null;
  tipo_servico: string;
  valor_total: number;
  forma_pagamento: FormaPagamento;
  numero_parcelas: number;
  data_primeiro_vencimento: string | null;
  status: StatusAcordo;
  observacoes: string | null;
  created_at: string;
  created_by: string | null;
  
  // Relações
  cliente?: {
    id: string;
    nome_completo: string;
    email: string;
    telefone: string;
  };
  processo?: {
    id: string;
    numero_processo: string | null;
    tipo: string;
  };
  parcelas?: ParcelaFinanceira[];
}

export interface ParcelaFinanceira {
  id: string;
  acordo_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  valor_pago: number | null;
  forma_pagamento_recebido: FormaPagamentoRecebido | null;
  status: StatusParcela;
  observacoes: string | null;
  created_at: string;
  pago_por: string | null;
  
  // Calculado
  dias_atraso?: number;
  status_calculado?: StatusParcela;
}

export interface HistoricoPagamento {
  id: string;
  parcela_id: string;
  valor: number;
  data_pagamento: string;
  forma_pagamento: string;
  observacoes: string | null;
  registrado_por: string | null;
  created_at: string;
}

export interface KPIsFinanceiros {
  receita_mes: number;
  recebido_mes: number;
  a_receber_mes: number;
  valor_atrasado: number;
  taxa_inadimplencia: number;
  ticket_medio: number;
}

export interface ReceitaMensal {
  mes: string;
  receita: number;
  quantidade: number;
}

export interface FluxoCaixa {
  data: string;
  entradas: number;
}

export interface DistribuicaoTipo {
  tipo: string;
  valor: number;
  quantidade: number;
  percentual: number;
}

export interface ParcelaVencendo {
  id: string;
  acordo_id: string;
  cliente_nome: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  dias_restantes: number;
}

export interface ClienteInadimplente {
  cliente_id: string;
  cliente_nome: string;
  total_atrasado: number;
  parcelas_atrasadas: number;
  maior_atraso_dias: number;
}

export interface MaiorPagador {
  cliente_id: string;
  cliente_nome: string;
  total_pago: number;
  quantidade_pagamentos: number;
}

export interface AcordosFilters {
  search?: string;
  status?: StatusAcordo[];
  cliente_id?: string;
  tipo_servico?: string;
  possui_atraso?: boolean;
  data_inicio?: Date;
  data_fim?: Date;
}

// Labels
export const STATUS_ACORDO_LABELS: Record<StatusAcordo, string> = {
  ativo: 'Ativo',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const STATUS_PARCELA_LABELS: Record<StatusParcela, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
};

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  a_vista: 'À Vista',
  parcelado: 'Parcelado',
};

export const FORMA_PAGAMENTO_RECEBIDO_LABELS: Record<FormaPagamentoRecebido, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência',
};

export type TipoRelatorio = 
  | 'receitas_periodo'
  | 'inadimplencia_detalhada'
  | 'fluxo_caixa_projetado'
  | 'performance_tipo_processo'
  | 'performance_cliente';

export const TIPOS_RELATORIO_LABELS: Record<TipoRelatorio, string> = {
  receitas_periodo: 'Receitas do Período',
  inadimplencia_detalhada: 'Inadimplência Detalhada',
  fluxo_caixa_projetado: 'Fluxo de Caixa Projetado',
  performance_tipo_processo: 'Performance por Tipo de Processo',
  performance_cliente: 'Performance por Cliente',
};
