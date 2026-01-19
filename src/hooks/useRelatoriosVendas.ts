import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subWeeks, subMonths, subQuarters, differenceInDays, parseISO } from "date-fns";

export type PeriodoRelatorio = "semanal" | "mensal" | "trimestral";

interface LeadData {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  tipo_processo: string;
  status: string;
  estagio: string | null;
  origem: string | null;
  utm_campaign: string | null;
  canal_especifico: string | null;
  created_at: string;
  primeiro_contato_em: string | null;
  data_ultima_atividade: string | null;
  valor_proposta: number | null;
}

interface KPIsData {
  totalLeads: number;
  leadsContatados: number;
  leadsConvertidos: number;
  taxaContato: number;
  taxaConversao: number;
  tempoMedioConversao: number | null;
  valorTotalPropostas: number;
}

interface CampanhaData {
  campanha: string;
  totalLeads: number;
  leadsContatados: number;
  leadsConvertidos: number;
  taxaConversao: number;
  valorMedioPropostas: number;
}

interface FunilData {
  estagio: string;
  label: string;
  quantidade: number;
  percentual: number;
}

interface ComparativoData {
  periodoAtual: KPIsData;
  periodoAnterior: KPIsData;
  variacaoLeads: number;
  variacaoConversao: number;
  variacaoContato: number;
}

function getDateRange(periodo: PeriodoRelatorio): { inicio: Date; fim: Date } {
  const now = new Date();
  
  switch (periodo) {
    case "semanal":
      return { inicio: startOfWeek(now, { weekStartsOn: 1 }), fim: endOfWeek(now, { weekStartsOn: 1 }) };
    case "mensal":
      return { inicio: startOfMonth(now), fim: endOfMonth(now) };
    case "trimestral":
      return { inicio: startOfQuarter(now), fim: endOfQuarter(now) };
    default:
      return { inicio: startOfMonth(now), fim: endOfMonth(now) };
  }
}

function getPreviousDateRange(periodo: PeriodoRelatorio): { inicio: Date; fim: Date } {
  const now = new Date();
  
  switch (periodo) {
    case "semanal":
      const prevWeek = subWeeks(now, 1);
      return { inicio: startOfWeek(prevWeek, { weekStartsOn: 1 }), fim: endOfWeek(prevWeek, { weekStartsOn: 1 }) };
    case "mensal":
      const prevMonth = subMonths(now, 1);
      return { inicio: startOfMonth(prevMonth), fim: endOfMonth(prevMonth) };
    case "trimestral":
      const prevQuarter = subQuarters(now, 1);
      return { inicio: startOfQuarter(prevQuarter), fim: endOfQuarter(prevQuarter) };
    default:
      const defaultPrev = subMonths(now, 1);
      return { inicio: startOfMonth(defaultPrev), fim: endOfMonth(defaultPrev) };
  }
}

function calculateKPIs(leads: LeadData[]): KPIsData {
  const totalLeads = leads.length;
  const leadsContatados = leads.filter(l => l.estagio && l.estagio !== 'novo').length;
  const leadsConvertidos = leads.filter(l => l.estagio === 'fechado').length;
  
  const taxaContato = totalLeads > 0 ? (leadsContatados / totalLeads) * 100 : 0;
  const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;
  
  // Calcular tempo médio de conversão
  const convertidos = leads.filter(l => l.estagio === 'fechado' && l.primeiro_contato_em && l.data_ultima_atividade);
  let tempoMedioConversao: number | null = null;
  
  if (convertidos.length > 0) {
    const totalDias = convertidos.reduce((acc, lead) => {
      const inicio = parseISO(lead.primeiro_contato_em!);
      const fim = parseISO(lead.data_ultima_atividade!);
      return acc + differenceInDays(fim, inicio);
    }, 0);
    tempoMedioConversao = Math.round(totalDias / convertidos.length);
  }
  
  const valorTotalPropostas = leads
    .filter(l => l.valor_proposta)
    .reduce((acc, l) => acc + (l.valor_proposta || 0), 0);
  
  return {
    totalLeads,
    leadsContatados,
    leadsConvertidos,
    taxaContato,
    taxaConversao,
    tempoMedioConversao,
    valorTotalPropostas
  };
}

function calculateCampanhas(leads: LeadData[]): CampanhaData[] {
  const campanhasMap = new Map<string, LeadData[]>();
  
  leads.forEach(lead => {
    const campanha = lead.utm_campaign || lead.canal_especifico || "Sem campanha";
    if (!campanhasMap.has(campanha)) {
      campanhasMap.set(campanha, []);
    }
    campanhasMap.get(campanha)!.push(lead);
  });
  
  return Array.from(campanhasMap.entries()).map(([campanha, leadsGrupo]) => {
    const totalLeads = leadsGrupo.length;
    const leadsContatados = leadsGrupo.filter(l => l.estagio && l.estagio !== 'novo').length;
    const leadsConvertidos = leadsGrupo.filter(l => l.estagio === 'fechado').length;
    const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;
    
    const leadsComProposta = leadsGrupo.filter(l => l.valor_proposta);
    const valorMedioPropostas = leadsComProposta.length > 0
      ? leadsComProposta.reduce((acc, l) => acc + (l.valor_proposta || 0), 0) / leadsComProposta.length
      : 0;
    
    return {
      campanha,
      totalLeads,
      leadsContatados,
      leadsConvertidos,
      taxaConversao,
      valorMedioPropostas
    };
  }).sort((a, b) => b.totalLeads - a.totalLeads);
}

function calculateFunil(leads: LeadData[]): FunilData[] {
  const estagios = [
    { key: 'novo', label: 'Novo' },
    { key: 'contato_inicial', label: 'Contato Inicial' },
    { key: 'em_analise', label: 'Em Análise' },
    { key: 'proposta_enviada', label: 'Proposta Enviada' },
    { key: 'fechado', label: 'Fechado' },
  ];
  
  const totalLeads = leads.length;
  
  return estagios.map(estagio => {
    const quantidade = leads.filter(l => l.estagio === estagio.key).length;
    const percentual = totalLeads > 0 ? (quantidade / totalLeads) * 100 : 0;
    
    return {
      estagio: estagio.key,
      label: estagio.label,
      quantidade,
      percentual
    };
  });
}

export function useRelatoriosVendas(periodo: PeriodoRelatorio) {
  const { inicio, fim } = getDateRange(periodo);
  const { inicio: inicioAnterior, fim: fimAnterior } = getPreviousDateRange(periodo);
  
  return useQuery({
    queryKey: ["relatorios-vendas", periodo],
    queryFn: async () => {
      // Buscar leads do período atual
      const { data: leadsAtuais, error: errorAtuais } = await supabase
        .from("contact_submissions")
        .select("*")
        .gte("created_at", inicio.toISOString())
        .lte("created_at", fim.toISOString());
      
      if (errorAtuais) throw errorAtuais;
      
      // Buscar leads do período anterior
      const { data: leadsAnteriores, error: errorAnteriores } = await supabase
        .from("contact_submissions")
        .select("*")
        .gte("created_at", inicioAnterior.toISOString())
        .lte("created_at", fimAnterior.toISOString());
      
      if (errorAnteriores) throw errorAnteriores;
      
      const kpisAtuais = calculateKPIs(leadsAtuais || []);
      const kpisAnteriores = calculateKPIs(leadsAnteriores || []);
      
      const comparativo: ComparativoData = {
        periodoAtual: kpisAtuais,
        periodoAnterior: kpisAnteriores,
        variacaoLeads: kpisAnteriores.totalLeads > 0 
          ? ((kpisAtuais.totalLeads - kpisAnteriores.totalLeads) / kpisAnteriores.totalLeads) * 100 
          : 0,
        variacaoConversao: kpisAnteriores.taxaConversao > 0 
          ? kpisAtuais.taxaConversao - kpisAnteriores.taxaConversao 
          : 0,
        variacaoContato: kpisAnteriores.taxaContato > 0 
          ? kpisAtuais.taxaContato - kpisAnteriores.taxaContato 
          : 0
      };
      
      const campanhas = calculateCampanhas(leadsAtuais || []);
      const funil = calculateFunil(leadsAtuais || []);
      
      return {
        kpis: kpisAtuais,
        comparativo,
        campanhas,
        funil,
        leads: leadsAtuais || []
      };
    }
  });
}

export function useRelatoriosVendasExport() {
  return useQuery({
    queryKey: ["relatorios-vendas-export"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: false // Será executado manualmente
  });
}
