import { useMemo } from "react";
import { useLeadsCsv, CsvLead } from "./useLeadsCsv";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, isAfter } from "date-fns";

export interface PlatformKPI {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface DailyLeads {
  date: string;
  fb: number;
  ig: number;
  organic: number;
  outro: number;
  total: number;
}

export interface CampaignPerformance {
  campaign: string;
  total: number;
  enviados: number;
  qualificados: number;
  convertidos: number;
  taxaConversao: number;
}

export interface ServiceDistribution {
  service: string;
  count: number;
}

export interface DailyConversion {
  date: string;
  leads: number;
  conversoes: number;
  taxa: number;
}

export interface MarketingCsvAnalytics {
  totalLeads: number;
  leadsHoje: number;
  leadsSemana: number;
  taxaEnvio: number;
  taxaConversao: number;
  taxaQualificacao: number;
  platformKPIs: PlatformKPI[];
  funnel: FunnelStage[];
  dailyLeads: DailyLeads[];
  campaigns: CampaignPerformance[];
  serviceDistribution: ServiceDistribution[];
  dailyConversions: DailyConversion[];
  isLoading: boolean;
}

// Unified lead shape used for all analytics calculations
interface UnifiedLead {
  dataRaw: Date | null;
  data: string;
  plataforma: string;
  status: string;
  campanha: string;
  anuncio: string;
  tipoServico: string;
}

function deriveEffectiveStatus(lead: CsvLead): string {
  if (lead.situacao && lead.situacao !== "Sem status") return lead.situacao;
  const ws = (lead.whatsappStatus || "").toUpperCase().trim();
  if (ws === "ENVIADO") return "Enviado";
  return "Novo";
}

function mapEstagioToStatus(estagio: string | null): string {
  switch (estagio) {
    case "contato_inicial": return "Enviado";
    case "em_analise":
    case "proposta_enviada": return "Qualificado";
    case "fechado": return "Convertido";
    case "perdido": return "Perdido";
    default: return "Novo";
  }
}

function csvToUnified(lead: CsvLead): UnifiedLead {
  return {
    dataRaw: lead.dataRaw,
    data: lead.data,
    plataforma: lead.plataforma || "outro",
    status: deriveEffectiveStatus(lead),
    campanha: lead.campanha || "-",
    anuncio: lead.adName || "-",
    tipoServico: lead.tipoServico || "-",
  };
}

function organicToUnified(row: { created_at: string; estagio: string | null; tipo_processo: string }): UnifiedLead {
  const d = new Date(row.created_at);
  return {
    dataRaw: d,
    data: format(d, "dd/MM/yyyy"),
    plataforma: "organic",
    status: mapEstagioToStatus(row.estagio),
    campanha: "Orgânico",
    anuncio: "Orgânico",
    tipoServico: row.tipo_processo || "-",
  };
}

function filterByPeriod(leads: UnifiedLead[], periodo: string): UnifiedLead[] {
  const now = new Date();
  let daysBack = 30;
  if (periodo === "7d") daysBack = 7;
  else if (periodo === "90d") daysBack = 90;
  const cutoff = subDays(now, daysBack);
  return leads.filter((l) => l.dataRaw && isAfter(l.dataRaw, cutoff));
}

function computeAnalytics(allLeads: UnifiedLead[], periodo: string, isLoading: boolean): MarketingCsvAnalytics {
  const empty: MarketingCsvAnalytics = {
    totalLeads: 0, leadsHoje: 0, leadsSemana: 0,
    taxaEnvio: 0, taxaConversao: 0, taxaQualificacao: 0,
    platformKPIs: [], funnel: [], dailyLeads: [], campaigns: [],
    serviceDistribution: [], dailyConversions: [], isLoading,
  };

  if (!allLeads.length) return empty;

  const filtered = filterByPeriod(allLeads, periodo);
  const total = filtered.length;
  if (total === 0) return { ...empty, isLoading };

  const now = new Date();
  const todayStr = format(now, "dd/MM/yyyy");
  const weekAgo = subDays(now, 7);
  const leadsHoje = filtered.filter((l) => l.data === todayStr).length;
  const leadsSemana = filtered.filter((l) => l.dataRaw && isAfter(l.dataRaw, weekAgo)).length;

  // Status counts
  const statusCounts: Record<string, number> = {};
  filtered.forEach((l) => { statusCounts[l.status] = (statusCounts[l.status] || 0) + 1; });

  const enviados = statusCounts["Enviado"] || 0;
  const qualificados = statusCounts["Qualificado"] || 0;
  const convertidos = statusCounts["Convertido"] || 0;

  const taxaEnvio = total > 0 ? Math.round((enviados / total) * 100) : 0;
  const taxaQualificacao = total > 0 ? Math.round((qualificados / total) * 100) : 0;
  const taxaConversao = total > 0 ? Math.round((convertidos / total) * 100) : 0;

  // Platform KPIs
  const platformCounts: Record<string, number> = {};
  filtered.forEach((l) => { platformCounts[l.plataforma] = (platformCounts[l.plataforma] || 0) + 1; });
  const platformLabels: Record<string, string> = { fb: "Facebook", ig: "Instagram", organic: "Orgânico" };
  const platformKPIs: PlatformKPI[] = Object.entries(platformCounts)
    .map(([key, count]) => ({ key, label: platformLabels[key] || key, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);

  // Funnel
  const funnelOrder = ["Novo", "Criado", "Enviado", "Qualificado", "Convertido"];
  const funnel: FunnelStage[] = funnelOrder
    .filter((s) => (statusCounts[s] || 0) > 0)
    .map((stage) => ({ stage, count: statusCounts[stage] || 0, percentage: Math.round(((statusCounts[stage] || 0) / total) * 100) }));
  if (funnel.length === 0) funnel.push({ stage: "Total Leads", count: total, percentage: 100 });

  // Daily evolution
  const dailyMap: Record<string, { fb: number; ig: number; organic: number; outro: number }> = {};
  filtered.forEach((l) => {
    if (!l.dataRaw) return;
    const day = format(l.dataRaw, "dd/MM");
    if (!dailyMap[day]) dailyMap[day] = { fb: 0, ig: 0, organic: 0, outro: 0 };
    const p = l.plataforma;
    if (p === "fb") dailyMap[day].fb++;
    else if (p === "ig") dailyMap[day].ig++;
    else if (p === "organic") dailyMap[day].organic++;
    else dailyMap[day].outro++;
  });
  const dailyLeads: DailyLeads[] = Object.entries(dailyMap)
    .map(([date, c]) => ({ date, ...c, total: c.fb + c.ig + c.organic + c.outro }))
    .sort((a, b) => {
      const [da, ma] = a.date.split("/").map(Number);
      const [db, mb] = b.date.split("/").map(Number);
      return ma !== mb ? ma - mb : da - db;
    });

  // Campaigns
  const campMap: Record<string, { total: number; enviados: number; qualificados: number; convertidos: number }> = {};
  filtered.forEach((l) => {
    const c = l.anuncio;
    if (!campMap[c]) campMap[c] = { total: 0, enviados: 0, qualificados: 0, convertidos: 0 };
    campMap[c].total++;
    if (l.status === "Enviado") campMap[c].enviados++;
    if (l.status === "Qualificado") campMap[c].qualificados++;
    if (l.status === "Convertido") campMap[c].convertidos++;
  });
  const campaigns: CampaignPerformance[] = Object.entries(campMap)
    .map(([campaign, d]) => ({ campaign, ...d, taxaConversao: d.total > 0 ? Math.round((d.convertidos / d.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);

  // Service distribution
  const serviceMap: Record<string, number> = {};
  filtered.forEach((l) => { if (l.tipoServico !== "-") serviceMap[l.tipoServico] = (serviceMap[l.tipoServico] || 0) + 1; });
  const serviceDistribution: ServiceDistribution[] = Object.entries(serviceMap)
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);

  // Daily conversions
  const dailyConvMap: Record<string, { leads: number; conversoes: number }> = {};
  filtered.forEach((l) => {
    if (!l.dataRaw) return;
    const day = format(l.dataRaw, "yyyy-MM-dd");
    if (!dailyConvMap[day]) dailyConvMap[day] = { leads: 0, conversoes: 0 };
    dailyConvMap[day].leads++;
    if (l.status === "Convertido") dailyConvMap[day].conversoes++;
  });
  const dailyConversions: DailyConversion[] = Object.entries(dailyConvMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date: format(new Date(date), "dd/MM"), leads: d.leads, conversoes: d.conversoes, taxa: d.leads > 0 ? Math.round((d.conversoes / d.leads) * 100) : 0 }));

  return {
    totalLeads: total, leadsHoje, leadsSemana,
    taxaEnvio, taxaConversao, taxaQualificacao,
    platformKPIs, funnel, dailyLeads, campaigns,
    serviceDistribution, dailyConversions, isLoading,
  };
}

export function useMarketingCsvAnalytics(periodo: string = "30d"): MarketingCsvAnalytics {
  const { data: csvData, isLoading: csvLoading } = useLeadsCsv();

  const { data: organicData, isLoading: organicLoading } = useQuery({
    queryKey: ["organic-leads-marketing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("created_at, estagio, tipo_processo")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = csvLoading || organicLoading;

  return useMemo(() => {
    const csvUnified = (csvData?.leads || []).map(csvToUnified);
    const organicUnified = (organicData || []).map(organicToUnified);
    const allLeads = [...csvUnified, ...organicUnified];
    return computeAnalytics(allLeads, periodo, isLoading);
  }, [csvData, organicData, isLoading, periodo]);
}
