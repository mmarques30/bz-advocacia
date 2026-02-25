import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type LeadGeral = Database["public"]["Tables"]["leads_geral"]["Row"];

export function useLeadsGeral(search?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["leads-geral", search],
    queryFn: async () => {
      let q = supabase
        .from("leads_geral")
        .select("*")
        .order("created_time", { ascending: false });

      if (search && search.trim()) {
        q = q.or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as LeadGeral[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("leads_geral")
        .update({ lead_status: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads-geral"] }),
  });

  const updateObservacoes = useMutation({
    mutationFn: async ({ id, observacoes }: { id: string; observacoes: string }) => {
      const { error } = await supabase
        .from("leads_geral")
        .update({ observacoes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads-geral"] }),
  });

  return { ...query, updateStatus, updateObservacoes };
}
