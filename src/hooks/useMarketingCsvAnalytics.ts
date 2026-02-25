import { useMemo } from "react";
import { useLeadsCsv, CsvLead } from "./useLeadsCsv";
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
  isLoading: boolean;
}

/**
 * Derives the effective status combining lead_status and whatsappStatus.
 * Priority: lead_status > whatsappStatus > default "Novo"
 */
function deriveEffectiveStatus(lead: CsvLead): string {
  // If situacao has a meaningful status (not "Sem status"), use it
  if (lead.situacao && lead.situacao !== "Sem status") {
    return lead.situacao;
  }
  // Check whatsappStatus for "ENVIADO" pattern
  const ws = (lead.whatsappStatus || "").toUpperCase().trim();
  if (ws === "ENVIADO") return "Enviado";
  // Default: Novo (lead exists but no action taken)
  return "Novo";
}

function filterByPeriod(leads: CsvLead[], periodo: string): CsvLead[] {
  const now = new Date();
  let daysBack = 30;
  if (periodo === "7d") daysBack = 7;
  else if (periodo === "90d") daysBack = 90;

  const cutoff = subDays(now, daysBack);
  return leads.filter((l) => l.dataRaw && isAfter(l.dataRaw, cutoff));
}

export function useMarketingCsvAnalytics(periodo: string = "30d"): MarketingCsvAnalytics {
  const { data, isLoading } = useLeadsCsv();

  return useMemo(() => {
    const empty: MarketingCsvAnalytics = {
      totalLeads: 0, leadsHoje: 0, leadsSemana: 0,
      taxaEnvio: 0, taxaConversao: 0, taxaQualificacao: 0,
      platformKPIs: [], funnel: [], dailyLeads: [], campaigns: [],
      isLoading,
    };

    if (!data?.leads?.length) return empty;

    const filtered = filterByPeriod(data.leads, periodo);
    const total = filtered.length;
    if (total === 0) return { ...empty, totalLeads: 0, isLoading };

    const now = new Date();
    const todayStr = format(now, "dd/MM/yyyy");
    const weekAgo = subDays(now, 7);
    const leadsHoje = filtered.filter((l) => l.data === todayStr).length;
    const leadsSemana = filtered.filter((l) => l.dataRaw && isAfter(l.dataRaw, weekAgo)).length;

    // Derive effective statuses
    const statusCounts: Record<string, number> = {};
    filtered.forEach((l) => {
      const s = deriveEffectiveStatus(l);
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    const enviados = statusCounts["Enviado"] || 0;
    const qualificados = statusCounts["Qualificado"] || 0;
    const convertidos = statusCounts["Convertido"] || 0;
    const novos = statusCounts["Novo"] || 0;
    const criados = statusCounts["Criado"] || 0;

    const taxaEnvio = total > 0 ? Math.round((enviados / total) * 100) : 0;
    const taxaQualificacao = total > 0 ? Math.round((qualificados / total) * 100) : 0;
    const taxaConversao = total > 0 ? Math.round((convertidos / total) * 100) : 0;

    // Platform KPIs
    const platformCounts: Record<string, number> = {};
    filtered.forEach((l) => {
      const key = l.plataforma || "outro";
      platformCounts[key] = (platformCounts[key] || 0) + 1;
    });

    const platformLabels: Record<string, string> = {
      fb: "Facebook", ig: "Instagram", organic: "Orgânico",
    };

    const platformKPIs: PlatformKPI[] = Object.entries(platformCounts)
      .map(([key, count]) => ({
        key,
        label: platformLabels[key] || key,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Funnel - use stages that actually exist in the data
    const funnelOrder = ["Novo", "Criado", "Enviado", "Qualificado", "Convertido"];
    const funnel: FunnelStage[] = funnelOrder
      .filter((stage) => (statusCounts[stage] || 0) > 0)
      .map((stage) => ({
        stage,
        count: statusCounts[stage] || 0,
        percentage: total > 0 ? Math.round(((statusCounts[stage] || 0) / total) * 100) : 0,
      }));

    // If funnel is empty, show all leads as "Total"
    if (funnel.length === 0) {
      funnel.push({ stage: "Total Leads", count: total, percentage: 100 });
    }

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
      .map(([date, counts]) => ({
        date, ...counts,
        total: counts.fb + counts.ig + counts.organic + counts.outro,
      }))
      .sort((a, b) => {
        const [da, ma] = a.date.split("/").map(Number);
        const [db, mb] = b.date.split("/").map(Number);
        return ma !== mb ? ma - mb : da - db;
      });

    // Campaigns
    const campMap: Record<string, { total: number; enviados: number; qualificados: number; convertidos: number }> = {};
    filtered.forEach((l) => {
      const c = l.campanha || "-";
      if (!campMap[c]) campMap[c] = { total: 0, enviados: 0, qualificados: 0, convertidos: 0 };
      campMap[c].total++;
      const status = deriveEffectiveStatus(l);
      if (status === "Enviado") campMap[c].enviados++;
      if (status === "Qualificado") campMap[c].qualificados++;
      if (status === "Convertido") campMap[c].convertidos++;
    });

    const campaigns: CampaignPerformance[] = Object.entries(campMap)
      .map(([campaign, d]) => ({
        campaign, ...d,
        taxaConversao: d.total > 0 ? Math.round((d.convertidos / d.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalLeads: total, leadsHoje, leadsSemana,
      taxaEnvio, taxaConversao, taxaQualificacao,
      platformKPIs, funnel, dailyLeads, campaigns, isLoading,
    };
  }, [data, isLoading, periodo]);
}
