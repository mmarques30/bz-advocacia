import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { ServiceDistribution } from "./useMarketingCsvAnalytics";

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

    // Add CSV data
    csvData.forEach((item) => {
      if (item.service && item.service !== "-") {
        merged[item.service] = (merged[item.service] || 0) + item.count;
      }
    });

    // Add organic data from contact_submissions
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
