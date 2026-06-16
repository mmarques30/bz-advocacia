import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MetaSyncStatus {
  ultima_structure: string | null;
  ultima_insights: string | null;
}

/** Le meta_execution_log pra mostrar quando foi a ultima sync ok. */
export function useMetaSyncStatus() {
  return useQuery({
    queryKey: ["meta-sync-status"],
    queryFn: async (): Promise<MetaSyncStatus> => {
      const { data, error } = await supabase
        .from("meta_execution_log")
        .select("function_name, finished_at")
        .eq("ok", true)
        .order("finished_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      const byFn: Record<string, string> = {};
      for (const row of (data ?? []) as any[]) {
        if (!byFn[row.function_name] && row.finished_at) byFn[row.function_name] = row.finished_at;
      }
      return {
        ultima_structure: byFn["meta-sync-structure"] ?? null,
        ultima_insights: byFn["meta-sync-insights"] ?? null,
      };
    },
    refetchInterval: 60 * 1000,
  });
}
