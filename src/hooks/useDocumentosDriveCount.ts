import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDocumentosDriveCount(processoId: string) {
  return useQuery({
    queryKey: ["documentos-drive-count", processoId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("documentos_drive")
        .select("*", { count: "exact", head: true })
        .eq("processo_id", processoId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!processoId,
  });
}
