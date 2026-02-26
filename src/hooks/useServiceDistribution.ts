import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { ServiceDistribution, PlatformKPI } from "./useMarketingCsvAnalytics";

export function useServiceDistribution(csvData: ServiceDistribution[]) {
  const { data: organicData } = useQuery({
    queryKey: ["service-distribution-organic"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("tipo_processo")
        .not("tipo_processo", "is", null);
      if (error) throw error;
      return data || [];
    },
  });

  return useMemo(() => {
    const merged: Record<string, number> = {};

    csvData.forEach((item) => {
      if (item.service && item.service !== "-") {
        merged[item.service] = (merged[item.service] || 0) + item.count;
      }
    });

    organicData?.forEach((row) => {
      const tipo = row.tipo_processo;
      if (tipo && tipo !== "-" && tipo !== "Outro") {
        merged[tipo] = (merged[tipo] || 0) + 1;
      }
    });

    return Object.entries(merged)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count);
  }, [csvData, organicData]);
}

const ORIGIN_LABEL_MAP: Record<string, string> = {
  site: "Site",
  indicacao: "Indicação",
  indicação: "Indicação",
  outro: "Orgânico",
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google",
  whatsapp: "WhatsApp",
};

const CSV_PLATFORM_LABEL_MAP: Record<string, string> = {
  fb: "Facebook",
  ig: "Instagram",
  organic: "Orgânico",
};

export function usePlatformDistribution(csvPlatformKPIs: PlatformKPI[]) {
  const { data: dbOrigins } = useQuery({
    queryKey: ["platform-distribution-organic"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("origem");
      if (error) throw error;
      return data || [];
    },
  });

  return useMemo(() => {
    const merged: Record<string, number> = {};

    // Add CSV platform data, mapping keys to readable labels
    csvPlatformKPIs.forEach((p) => {
      const label = CSV_PLATFORM_LABEL_MAP[p.key] || p.label || p.key;
      merged[label] = (merged[label] || 0) + p.count;
    });

    // Add organic data from contact_submissions origins
    dbOrigins?.forEach((row) => {
      const origem = (row.origem || "outro").toLowerCase().trim();
      const label = ORIGIN_LABEL_MAP[origem] || origem.charAt(0).toUpperCase() + origem.slice(1);
      merged[label] = (merged[label] || 0) + 1;
    });

    const total = Object.values(merged).reduce((s, c) => s + c, 0);

    return Object.entries(merged)
      .map(([label, count]) => ({
        key: label.toLowerCase(),
        label,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [csvPlatformKPIs, dbOrigins]);
}

const ESTAGIO_FUNNEL_MAP: Record<string, string> = {
  novo: "Novo",
  contato_inicial: "Enviado",
  em_analise: "Qualificado",
  fechado: "Convertido",
};

export function useFunnelUnificado(csvFunnel: { stage: string; count: number; percentage: number }[]) {
  const { data: organicStages } = useQuery({
    queryKey: ["funnel-organic-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("estagio");
      if (error) throw error;
      return data || [];
    },
  });

  return useMemo(() => {
    const merged: Record<string, number> = {};

    csvFunnel.forEach((s) => {
      merged[s.stage] = (merged[s.stage] || 0) + s.count;
    });

    organicStages?.forEach((row) => {
      const estagio = (row.estagio || "novo").toLowerCase().trim();
      const label = ESTAGIO_FUNNEL_MAP[estagio];
      if (label) {
        merged[label] = (merged[label] || 0) + 1;
      }
    });

    const order = ["Novo", "Enviado", "Qualificado", "Convertido"];
    const total = Object.values(merged).reduce((s, c) => s + c, 0);

    return order
      .filter((stage) => merged[stage] && merged[stage] > 0)
      .map((stage) => ({
        stage,
        count: merged[stage],
        percentage: total > 0 ? Math.round((merged[stage] / total) * 100) : 0,
      }));
  }, [csvFunnel, organicStages]);
}
