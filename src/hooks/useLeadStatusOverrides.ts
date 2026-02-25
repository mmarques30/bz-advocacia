import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLeadStatusOverrides() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["lead-status-overrides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads_status_overrides" as any)
        .select("lead_csv_id, lead_status");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data as any[])?.forEach((row: any) => {
        map[row.lead_csv_id] = row.lead_status;
      });
      return map;
    },
  });

  const upsertStatus = useMutation({
    mutationFn: async ({ leadCsvId, status }: { leadCsvId: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("leads_status_overrides" as any)
        .upsert(
          {
            lead_csv_id: leadCsvId,
            lead_status: status,
            updated_at: new Date().toISOString(),
            updated_by: user?.id || null,
          } as any,
          { onConflict: "lead_csv_id" }
        );
      if (error) throw error;
    },
    onMutate: async ({ leadCsvId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["lead-status-overrides"] });
      const prev = queryClient.getQueryData<Record<string, string>>(["lead-status-overrides"]);
      queryClient.setQueryData<Record<string, string>>(["lead-status-overrides"], (old) => ({
        ...old,
        [leadCsvId]: status,
      }));
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["lead-status-overrides"], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-status-overrides"] });
    },
  });

  return { overrides: query.data || {}, isLoading: query.isLoading, upsertStatus };
}
