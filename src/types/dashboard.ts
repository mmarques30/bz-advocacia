export interface KPI {
  totalLeads: number;
  taxaConversao: number;
  novosClientes: number;
  processosAtivos: number;
  receitaMes: number;
  taxaInadimplencia: number;
}

export interface FunnelStage {
  estagio: string;
  count: number;
  percentage: number;
}

export interface RevenueData {
  mes: string;
  receita: number;
  meta: number;
}

export interface LeadsEvolutionData {
  mes: string;
  atual: number;
  anterior: number;
}

export interface Alert {
  id: string;
  tipo: 'lead_parado' | 'prazo_vencendo' | 'parcela_atrasada' | 'processo_sem_update';
  titulo: string;
  descricao: string;
  severity: 'warning' | 'error' | 'info';
  link?: string;
}

export interface Activity {
  id: string;
  usuario: string;
  avatar?: string;
  tipo: string;
  descricao: string;
  timestamp: Date;
}

export interface DashboardFilters {
  periodo: '7d' | '30d' | '90d' | 'custom';
  tipoProcesso?: string;
  origem?: string;
  startDate?: Date;
  endDate?: Date;
}
