import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead, LeadsFilters } from "@/types/leads";
import { toast } from "@/lib/toast";

export function useLeads(filters: LeadsFilters) {
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: async () => {
      let query = supabase
        .from("contact_submissions")
        .select("*")
        .order("data_ultima_atividade", { ascending: false });

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `nome_completo.ilike.%${filters.search}%,email.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`
        );
      }

      // Apply status filter
      if (filters.status.length > 0) {
        query = query.in("estagio", filters.status);
      }

      // Apply origem filter
      if (filters.origem.length > 0) {
        query = query.in("origem", filters.origem);
      }

      // Apply tipo processo filter
      if (filters.tipoProcesso.length > 0) {
        query = query.in("tipo_processo", filters.tipoProcesso);
      }

      // Apply date range filter
      if (filters.dateRange.start) {
        query = query.gte("created_at", filters.dateRange.start.toISOString());
      }
      if (filters.dateRange.end) {
        query = query.lte("created_at", filters.dateRange.end.toISOString());
      }

      // Apply responsavel filter
      if (filters.responsavel) {
        query = query.eq("responsavel_id", filters.responsavel);
      }

      // Apply status_cliente filter
      if (filters.statusCliente && filters.statusCliente.length > 0) {
        query = query.in("status_cliente", filters.statusCliente);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Carrega dados do bot SDR (leads_geral) para os leads que têm vínculo
      const leadGeralIds = (data || [])
        .map((l: any) => l.lead_geral_id)
        .filter((id: string | null) => !!id);

      let botMap: Record<string, any> = {};
      if (leadGeralIds.length > 0) {
        const { data: botData } = await supabase
          .from("leads_geral")
          .select("id, status_sdr, fluxo_sdr, area_normalizada, score, etapa_qualificacao, bot_pausado, ultima_mensagem_em")
          .in("id", leadGeralIds);
        botMap = Object.fromEntries((botData || []).map((b: any) => [b.id, b]));
      }

      const leadsWithDiasParado = (data || []).map((lead) => {
        const dataUltimaAtividade = new Date(lead.data_ultima_atividade);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - dataUltimaAtividade.getTime());
        const diasParado = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const bot = (lead as any).lead_geral_id ? botMap[(lead as any).lead_geral_id] : null;

        return {
          ...lead,
          dias_parado: diasParado,
          origem_descricao: lead.outro_como_conheceu || null,
          status_sdr: bot?.status_sdr ?? null,
          fluxo_sdr: bot?.fluxo_sdr ?? null,
          area_normalizada: bot?.area_normalizada ?? null,
          score: bot?.score ?? null,
          etapa_qualificacao: bot?.etapa_qualificacao ?? null,
          bot_pausado: bot?.bot_pausado ?? null,
          ultima_mensagem_em: bot?.ultima_mensagem_em ?? null,
        } as Lead;
      });

      // Apply dias parado filter
      let filteredLeads = leadsWithDiasParado;
      if (filters.diasParado.max !== null) {
        filteredLeads = leadsWithDiasParado.filter(
          (lead) =>
            lead.dias_parado! >= filters.diasParado.min &&
            lead.dias_parado! <= filters.diasParado.max!
        );
      } else if (filters.diasParado.min > 0) {
        filteredLeads = leadsWithDiasParado.filter(
          (lead) => lead.dias_parado! >= filters.diasParado.min
        );
      }

      return filteredLeads;
    },
  });
}

export function useUpdateLeadStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estagio }: { id: string; estagio: string }) => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .update({ 
          estagio,
          data_ultima_atividade: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
      toast({
        title: "Lead atualizado",
        description: "O estágio do lead foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadData: Partial<Lead>) => {
      const { dias_parado, ...dataToInsert } = leadData;
      const { data, error } = await supabase
        .from("contact_submissions")
        .insert({
          ...dataToInsert,
          estagio: leadData.estagio || 'novo',
          origem: leadData.origem || 'site',
          prioridade: leadData.prioridade || 'media',
          data_ultima_atividade: new Date().toISOString(),
          lgpd_consent: true,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Criar atividade de lead criado
      await supabase.from("atividades").insert({
        tipo: "lead_criado",
        descricao: "Lead criado manualmente",
        entidade_tipo: "lead",
        entidade_id: data.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
      toast({
        title: "Lead criado",
        description: "O lead foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { dias_parado, ...dataToUpdate } = updates;
      const { data, error } = await supabase
        .from("contact_submissions")
        .update(dataToUpdate as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Criar atividade de edição
      await supabase.from("atividades").insert({
        tipo: "editado",
        descricao: "Informações do lead foram atualizadas",
        entidade_tipo: "lead",
        entidade_id: id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
      toast({
        title: "Lead atualizado",
        description: "As informações do lead foram atualizadas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from("contact_submissions")
        .delete()
        .eq("id", leadId);

      if (error) throw error;
      
      return leadId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
      
      toast({
        title: "Lead excluído",
        description: "O lead foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useBulkCreateLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leads: Partial<Lead>[]) => {
      const leadsToInsert = leads.map(lead => ({
        nome_completo: lead.nome_completo || "",
        email: lead.email || "",
        telefone: lead.telefone || "",
        tipo_processo: lead.tipo_processo || "",
        origem: lead.origem || "site",
        estagio: lead.estagio || "novo",
        prioridade: lead.prioridade || "media",
        mensagem: lead.mensagem || "",
        como_conheceu: lead.origem || "site",
        data_ultima_atividade: new Date().toISOString(),
        lgpd_consent: true,
      }));

      const { data, error } = await supabase
        .from("contact_submissions")
        .insert(leadsToInsert as any)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: Error) => {
      // Antes: so console.error -> falha silenciosa pro usuario.
      // Agora: alerta visual via toast garantindo feedback no UI.
      console.error("Bulk create error:", error);
      toast({
        title: "Erro ao importar leads",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
