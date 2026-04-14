import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

export interface ConfiguracoesEscritorio {
  id: string;
  nome_escritorio: string;
  cnpj?: string;
  oab_principal?: string;
  email?: string;
  telefone?: string;
  site?: string;
  cep?: string;
  endereco_completo?: string;
  cidade?: string;
  estado?: string;
  logo_url?: string;
  redes_sociais?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    whatsapp?: string;
    youtube?: string;
  };
  preferencias?: {
    tema?: string;
    fuso_horario?: string;
    formato_data?: string;
    moeda?: string;
  };
}

export const useConfiguracoesEscritorio = () => {
  const queryClient = useQueryClient();

  const { data: configuracoes, isLoading } = useQuery({
    queryKey: ["configuracoes-escritorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes_escritorio" as any)
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return (data as any) as ConfiguracoesEscritorio | null;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: Partial<ConfiguracoesEscritorio>) => {
      const { data: existing } = await supabase
        .from("configuracoes_escritorio" as any)
        .select("id")
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from("configuracoes_escritorio" as any)
          .update(values as any)
          .eq("id", (existing as any).id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("configuracoes_escritorio" as any)
          .insert(values as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes-escritorio"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("escritorio-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("escritorio-logos")
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onError: (error) => {
      console.error("Erro ao fazer upload do logo:", error);
      toast.error("Erro ao fazer upload do logo");
    },
  });

  return {
    configuracoes,
    isLoading,
    updateConfiguracoesEscritorio: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    uploadLogo: uploadLogoMutation.mutateAsync,
    isUploadingLogo: uploadLogoMutation.isPending,
  };
};
