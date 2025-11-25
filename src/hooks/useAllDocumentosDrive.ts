import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentoDrive } from "@/types/documentos-drive";

export interface DocumentoDriveWithProcess extends DocumentoDrive {
  processo?: {
    id: string;
    numero_processo: string | null;
    tipo: string;
  } | null;
}

export function useAllDocumentosDrive() {
  return useQuery({
    queryKey: ["all-documentos-drive"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_drive")
        .select(`
          *,
          processo:processos(id, numero_processo, tipo)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DocumentoDriveWithProcess[];
    },
  });
}
