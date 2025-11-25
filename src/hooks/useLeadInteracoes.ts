import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadInteracao } from "@/types/bot";

export function useLeadInteracoes(leadId: string) {
  return useQuery({
    queryKey: ['lead-interacoes', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_interacoes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as LeadInteracao[];
    },
    enabled: !!leadId,
  });
}
