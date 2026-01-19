import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO, subDays } from "date-fns";

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

export interface KPIsData {
  totalLeads: number;
  leadsContatados: number;
  leadsConvertidos: number;
  taxaContato: number;
  taxaConversao: number;
  tempoMedioConversao: number | null;
  valorTotalPropostas: number;
}

export interface CampanhaData {
  campanha: string;
  totalLeads: number;
  leadsContatados: number;
  leadsConvertidos: number;
  taxaConversao: number;
  valorMedioPropostas: number;
}

export interface FunilData {
  estagio: string;
  label: string;
  quantidade: number;
  percentual: number;
}

export interface StatusData {
  status: string;
  quantidade: number;
  percentual: number;
}

export interface ContatoData {
  totalLeads: number;
  leadsContatados: number;
  taxaContato: number;
  tempoMedioResposta: number | null;
  leadsSemContato: number;
}

function calculateKPIs(leads: LeadData[]): KPIsData {
  const totalLeads = leads.length;
  const leadsContatados = leads.filter(l => l.estagio && l.estagio !== 'novo').length;
  const leadsConvertidos = leads.filter(l => l.estagio === 'fechado').length;
  
  const taxaContato = totalLeads > 0 ? (leadsContatados / totalLeads) * 100 : 0;
  const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;
  
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

function calculateStatus(leads: LeadData[]): StatusData[] {
  const statusMap = new Map<string, number>();
  const totalLeads = leads.length;
  
  leads.forEach(lead => {
    const status = lead.status || 'Pendente';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });
  
  return Array.from(statusMap.entries()).map(([status, quantidade]) => ({
    status,
    quantidade,
    percentual: totalLeads > 0 ? (quantidade / totalLeads) * 100 : 0
  })).sort((a, b) => b.quantidade - a.quantidade);
}

function calculateContato(leads: LeadData[]): ContatoData {
  const totalLeads = leads.length;
  const leadsContatados = leads.filter(l => l.primeiro_contato_em).length;
  const leadsSemContato = totalLeads - leadsContatados;
  const taxaContato = totalLeads > 0 ? (leadsContatados / totalLeads) * 100 : 0;
  
  // Calcular tempo médio de resposta (primeiro contato - created_at)
  const contatados = leads.filter(l => l.primeiro_contato_em);
  let tempoMedioResposta: number | null = null;
  
  if (contatados.length > 0) {
    const totalHoras = contatados.reduce((acc, lead) => {
      const criacao = parseISO(lead.created_at);
      const contato = parseISO(lead.primeiro_contato_em!);
      return acc + Math.abs(differenceInDays(contato, criacao));
    }, 0);
    tempoMedioResposta = Math.round(totalHoras / contatados.length);
  }
  
  return {
    totalLeads,
    leadsContatados,
    taxaContato,
    tempoMedioResposta,
    leadsSemContato
  };
}

export function useRelatoriosVendasPeriodo(dataInicio: Date, dataFim: Date) {
  const diasPeriodo = differenceInDays(dataFim, dataInicio);
  const inicioAnterior = subDays(dataInicio, diasPeriodo + 1);
  const fimAnterior = subDays(dataInicio, 1);
  
  return useQuery({
    queryKey: ["relatorios-vendas-periodo", dataInicio.toISOString(), dataFim.toISOString()],
    queryFn: async () => {
      // Buscar leads do período atual
      const { data: leadsAtuais, error: errorAtuais } = await supabase
        .from("contact_submissions")
        .select("*")
        .gte("created_at", dataInicio.toISOString())
        .lte("created_at", dataFim.toISOString());
      
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
      
      const comparativo = {
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
      const status = calculateStatus(leadsAtuais || []);
      const contato = calculateContato(leadsAtuais || []);
      
      return {
        kpis: kpisAtuais,
        kpisAnteriores,
        comparativo,
        campanhas,
        funil,
        status,
        contato,
        leads: leadsAtuais || []
      };
    }
  });
}
