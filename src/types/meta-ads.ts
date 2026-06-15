export interface MetaConnection {
  id: string;
  user_id: string;
  access_token: string;
  token_expires_at: string;
  account_id: string;
  account_name: string | null;
  status: string;
  conectado_em: string;
  ultima_sincronizacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetaMetrica {
  id: string;
  connection_id: string;
  data_referencia: string;
  gasto: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  ctr: number;
  cpc: number;
  leads: number;
  custo_lead: number;
  created_at: string;
}

export interface MetaCampanha {
  id: string;
  connection_id: string;
  campaign_id: string;
  nome: string;
  status: string | null;
  objetivo: string | null;
  gasto: number;
  impressoes: number;
  cliques: number;
  leads: number;
  custo_lead: number;
  ctr: number;
  atualizado_em: string;
}

export interface MetaRelatorioAuto {
  id: string;
  connection_id: string;
  ativo: boolean;
  frequencia: 'diaria' | 'semanal' | 'mensal';
  dia_semana: number | null;
  dia_mes: number | null;
  horario: string;
  destinatarios: string[];
  assunto: string | null;
  mensagem: string | null;
  formato: 'pdf' | 'excel' | 'ambos';
  proximo_envio: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetaEnvioHistorico {
  id: string;
  relatorio_config_id: string;
  data_envio: string;
  status: 'sucesso' | 'erro';
  destinatarios: string[];
  periodo_inicio: string | null;
  periodo_fim: string | null;
  erro_mensagem: string | null;
}

export interface MetaKPIs {
  gasto: number;
  gastoVariacao: number;
  leads: number;
  leadsVariacao: number;
  custoLead: number;
  custoLeadVariacao: number;
  cliques: number;
  cliquesVariacao: number;
  ctr: number;
  ctrVariacao: number;
  impressoes: number;
  cpc: number;
  // Vem de v_meta_lead_funnel (leads reais que entraram pelo bot e
  // viraram cliente/agendado/assumido/sql). Opcional pra preservar
  // consumidores legados.
  taxaConversao?: number;
  leadsConvertidos?: number;
}

export interface MetaChartData {
  data: string;
  gasto: number;
  leads: number;
}

export type PeriodoFiltro = '7d' | '30d' | '90d' | 'custom';
