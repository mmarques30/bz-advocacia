import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

export interface AdvogadoSdr {
  id: string;
  nome: string;
  user_id: string | null;
  ativo: boolean;
}

export function useAdvogadosSdr() {
  return useQuery({
    queryKey: ["advogados-sdr-ativos"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("advogados_sdr")
        .select("id, nome, user_id, ativo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as AdvogadoSdr[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** Retorna o advogado_sdr.id ligado ao usuário logado (ou null). */
export function useMeuAdvogadoId() {
  return useQuery({
    queryKey: ["meu-advogado-sdr-id"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await (supabase as any)
        .from("advogados_sdr")
        .select("id")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .maybeSingle();
      return (data?.id as string) ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** Retorna true se o usuário logado tem role 'admin'. */
export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      return (data ?? []).some((r: any) => r.role === "admin");
    },
    staleTime: 1000 * 60 * 5,
  });
}

interface ReatribuirArgs {
  lead_id: string;
  novo_responsavel_id: string | null;
  motivo?: string;
}

export function useReatribuirLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: ReatribuirArgs) => {
      const { data, error } = await supabase.functions.invoke("reatribuir-conversa", {
        body: args,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_d, vars) => {
      toast.success(
        vars.novo_responsavel_id
          ? "Lead reatribuído com sucesso."
          : "Lead devolvido ao pool.",
      );
      qc.invalidateQueries({ queryKey: ["lead-info", vars.lead_id] });
      qc.invalidateQueries({ queryKey: ["lead-reatribuicoes", vars.lead_id] });
      qc.invalidateQueries({ queryKey: ["atendimento-conversas"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: any) => {
      const map: Record<string, string> = {
        sem_permissao_reatribuir: "Você não tem permissão pra reatribuir este lead.",
        lead_nao_encontrado: "Lead não encontrado.",
        novo_responsavel_invalido: "Advogado selecionado não está ativo.",
      };
      toast.error(map[err?.message] ?? err?.message ?? "Erro ao reatribuir lead");
    },
  });
}
