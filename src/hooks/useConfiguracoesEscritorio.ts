import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConfiguracoesEscritorio {
  id: string;
  nome_escritorio: string;
  cnpj?: string;
  oab_principal?: string;
  telefone?: string;
  email?: string;
  endereco_completo?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  logo_url?: string;
  site?: string;
  redes_sociais?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  preferencias?: {
    notificacoes_email?: boolean;
    alertas_prazos?: boolean;
    backup_automatico?: boolean;
    fuso_horario?: string;
  };
}

export const useConfiguracoesEscritorio = () => {
  return useQuery({
    queryKey: ["configuracoes-escritorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes_escritorio")
        .select("*")
        .single();

      if (error) throw error;
      return data as ConfiguracoesEscritorio;
    },
  });
};

export const useUpdateConfiguracoesEscritorio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ConfiguracoesEscritorio>) => {
      const { data: existing } = await supabase
        .from("configuracoes_escritorio")
        .select("id")
        .single();

      if (existing) {
        const { data: updated, error } = await supabase
          .from("configuracoes_escritorio")
          .update(data)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from("configuracoes_escritorio")
          .insert([{ nome_escritorio: "Escritório", ...data }])
          .select()
          .single();

        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes-escritorio"] });
      toast.success("Configurações salvas com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    },
  });
};
