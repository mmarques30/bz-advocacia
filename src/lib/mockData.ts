import { KPI, FunnelStage, RevenueData, LeadsEvolutionData, Alert, Activity } from '@/types/dashboard';

export const mockKPIs: KPI = {
  totalLeads: 127,
  taxaConversao: 23.5,
  novosClientes: 8,
  processosAtivos: 45,
  receitaMes: 125000,
  taxaInadimplencia: 5.2,
};

export const mockFunnelData: FunnelStage[] = [
  { estagio: 'Novo', count: 127, percentage: 100 },
  { estagio: 'Contato', count: 89, percentage: 70 },
  { estagio: 'Análise', count: 56, percentage: 44 },
  { estagio: 'Proposta', count: 34, percentage: 27 },
  { estagio: 'Fechado', count: 23, percentage: 18 },
];

export const mockRevenueData: RevenueData[] = [
  { mes: 'Mai', receita: 98000, meta: 100000 },
  { mes: 'Jun', receita: 112000, meta: 100000 },
  { mes: 'Jul', receita: 95000, meta: 100000 },
  { mes: 'Ago', receita: 128000, meta: 100000 },
  { mes: 'Set', receita: 115000, meta: 100000 },
  { mes: 'Out', receita: 125000, meta: 100000 },
];

export const mockLeadsEvolution: LeadsEvolutionData[] = [
  { mes: 'Mai', atual: 89, anterior: 76 },
  { mes: 'Jun', atual: 95, anterior: 82 },
  { mes: 'Jul', atual: 102, anterior: 89 },
  { mes: 'Ago', atual: 118, anterior: 95 },
  { mes: 'Set', atual: 124, anterior: 102 },
  { mes: 'Out', atual: 127, anterior: 118 },
];

export const mockAlerts: Alert[] = [
  {
    id: '1',
    tipo: 'lead_parado',
    titulo: '12 leads sem atividade',
    descricao: 'Leads parados há mais de 7 dias',
    severity: 'warning',
  },
  {
    id: '2',
    tipo: 'prazo_vencendo',
    titulo: '5 prazos próximos',
    descricao: 'Vencendo nos próximos 7 dias',
    severity: 'error',
  },
  {
    id: '3',
    tipo: 'parcela_atrasada',
    titulo: '3 parcelas atrasadas',
    descricao: 'Total de R$ 15.450,00',
    severity: 'error',
  },
  {
    id: '4',
    tipo: 'processo_sem_update',
    titulo: '8 processos sem atualização',
    descricao: 'Sem movimentação há mais de 30 dias',
    severity: 'info',
  },
];

export const mockActivities: Activity[] = [
  {
    id: '1',
    usuario: 'Ana Silva',
    tipo: 'lead_criado',
    descricao: 'Novo lead cadastrado - Inventário',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    usuario: 'Carlos Mendes',
    tipo: 'status_alterado',
    descricao: 'Lead movido para "Proposta"',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: '3',
    usuario: 'Beatriz Costa',
    tipo: 'documento_enviado',
    descricao: 'Documentos enviados para cliente',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: '4',
    usuario: 'Ana Silva',
    tipo: 'processo_atualizado',
    descricao: 'Processo #2024-001 atualizado',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    id: '5',
    usuario: 'Carlos Mendes',
    tipo: 'pagamento_recebido',
    descricao: 'Pagamento de R$ 5.000,00 confirmado',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];
