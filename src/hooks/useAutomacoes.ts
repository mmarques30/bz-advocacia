import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileSpreadsheet, Scale, Facebook, MessageCircle, Search, Globe, LucideIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface ApiIntegration {
  id: string;
  nome: string;
  descricao: string;
  status: "ativo" | "pendente" | "erro" | "inativo";
  totalConsultas: number;
  consultasSucesso: number;
  consultasErro: number;
  ultimaAtividade: string | null;
  edgeFunctionPath: string | null;
  endpoint: string | null;
  icone: LucideIcon;
  configurado: boolean;
  podeEditar: boolean;
  podeExcluir: boolean;
  tabelaOrigem: "meta_connections" | "whatsapp_config" | "consultas_config" | null;
  detalhes: {
    provedor?: string;
    ambiente?: string;
    creditos?: number;
    accountId?: string;
    accountName?: string;
    ultimaSincronizacao?: string;
    telefone?: string;
    phoneNumberId?: string;
    webhookUrl?: string;
    apiKeyMasked?: string;
    rateLimit?: string;
    leadsImportados?: number;
    leadsUltimas24h?: number;
  };
}

export function useAutomacoes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["automacoes"],
    queryFn: async () => {
      // Fetch all configurations in parallel
      const [consultasConfig, metaConnections, whatsappConfig, consultasRealizadas, leads] = await Promise.all([
        supabase.from("consultas_config").select("*").maybeSingle(),
        supabase.from("meta_connections").select("*").maybeSingle(),
        supabase.from("whatsapp_config").select("*").maybeSingle(),
        supabase.from("consultas_realizadas").select("id, status, created_at, tipo_consulta"),
        supabase.from("contact_submissions").select("id, origem, created_at"),
      ]);

      // Calculate statistics
      const consultasData = consultasRealizadas.data || [];
      const leadsData = leads.data || [];

      // Datajud stats
      const datajudConsultas = consultasData.filter((c) => c.tipo_consulta === "processo");
      const datajudSucesso = datajudConsultas.filter((c) => c.status === "sucesso").length;
      const datajudErro = datajudConsultas.filter((c) => c.status === "erro").length;
      const datajudUltima = datajudConsultas.length > 0 ? datajudConsultas[0].created_at : null;

      // API Consultas stats (veiculos, imoveis, etc - not processo or cnpj)
      const apiConsultas = consultasData.filter(
        (c) => !["processo", "cnpj"].includes(c.tipo_consulta)
      );
      const apiSucesso = apiConsultas.filter((c) => c.status === "sucesso").length;
      const apiErro = apiConsultas.filter((c) => c.status === "erro").length;
      const apiUltima = apiConsultas.length > 0 ? apiConsultas[0].created_at : null;

      // BrasilAPI stats (CNPJ)
      const brasilApiConsultas = consultasData.filter((c) => c.tipo_consulta === "cnpj");
      const brasilApiSucesso = brasilApiConsultas.filter((c) => c.status === "sucesso").length;
      const brasilApiErro = brasilApiConsultas.filter((c) => c.status === "erro").length;
      const brasilApiUltima = brasilApiConsultas.length > 0 ? brasilApiConsultas[0].created_at : null;

      // Google Sheets stats (leads from sheets)
      const sheetsLeads = leadsData.filter((l) => l.origem === "google-sheets" || l.origem === "planilha");
      const sheetsUltima = sheetsLeads.length > 0 ? sheetsLeads[0].created_at : null;

      // Build integrations array
      const integrations: ApiIntegration[] = [
        {
          id: "google-sheets",
          nome: "Google Sheets",
          descricao: "Importação de leads via planilha Google",
          status: sheetsLeads.length > 0 ? "ativo" : "pendente",
          totalConsultas: sheetsLeads.length,
          consultasSucesso: sheetsLeads.length,
          consultasErro: 0,
          ultimaAtividade: sheetsUltima,
          edgeFunctionPath: "receive-sheet-lead",
          endpoint: null,
          icone: FileSpreadsheet,
          configurado: true,
          podeEditar: false,
          podeExcluir: false,
          tabelaOrigem: null,
          detalhes: {
            webhookUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/receive-sheet-lead`,
            leadsImportados: sheetsLeads.length,
            leadsUltimas24h: sheetsLeads.filter(
              (l) => new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length,
          },
        },
        {
          id: "datajud",
          nome: "Datajud (CNJ)",
          descricao: "Consulta de processos judiciais via API do CNJ",
          status: datajudConsultas.length > 0 ? "ativo" : "pendente",
          totalConsultas: datajudConsultas.length,
          consultasSucesso: datajudSucesso,
          consultasErro: datajudErro,
          ultimaAtividade: datajudUltima,
          edgeFunctionPath: "consultas-datajud",
          endpoint: "https://api-publica.datajud.cnj.jus.br",
          icone: Scale,
          configurado: true,
          podeEditar: false,
          podeExcluir: false,
          tabelaOrigem: null,
          detalhes: {
            provedor: "CNJ",
            ambiente: "producao",
            apiKeyMasked: "****-****-****-**** (configurada)",
            rateLimit: "100 req/min",
          },
        },
        {
          id: "meta-ads",
          nome: "Meta Ads",
          descricao: "Integração com Facebook/Instagram Ads",
          status: metaConnections.data?.status === "ativo" ? "ativo" : metaConnections.data ? "pendente" : "inativo",
          totalConsultas: 0,
          consultasSucesso: 0,
          consultasErro: 0,
          ultimaAtividade: metaConnections.data?.ultima_sincronizacao || null,
          edgeFunctionPath: "meta-metrics",
          endpoint: "https://graph.facebook.com",
          icone: Facebook,
          configurado: !!metaConnections.data,
          podeEditar: !!metaConnections.data,
          podeExcluir: !!metaConnections.data,
          tabelaOrigem: "meta_connections",
          detalhes: {
            accountId: metaConnections.data?.account_id,
            accountName: metaConnections.data?.account_name,
            ultimaSincronizacao: metaConnections.data?.ultima_sincronizacao,
          },
        },
        {
          id: "whatsapp",
          nome: "WhatsApp Business",
          descricao: "Envio de mensagens e notificações via WhatsApp",
          status: whatsappConfig.data?.active ? "ativo" : whatsappConfig.data ? "pendente" : "inativo",
          totalConsultas: 0,
          consultasSucesso: 0,
          consultasErro: 0,
          ultimaAtividade: whatsappConfig.data?.updated_at || null,
          edgeFunctionPath: "whatsapp-send",
          endpoint: null,
          icone: MessageCircle,
          configurado: !!whatsappConfig.data,
          podeEditar: !!whatsappConfig.data,
          podeExcluir: !!whatsappConfig.data,
          tabelaOrigem: "whatsapp_config",
          detalhes: {
            provedor: whatsappConfig.data?.provider,
            telefone: whatsappConfig.data?.phone_number,
            phoneNumberId: whatsappConfig.data?.phone_number_id,
          },
        },
        {
          id: "consultas-api",
          nome: "API de Consultas",
          descricao: "Consultas de veículos, imóveis e outros",
          status: consultasConfig.data?.ativo ? "ativo" : consultasConfig.data ? "pendente" : "inativo",
          totalConsultas: apiConsultas.length,
          consultasSucesso: apiSucesso,
          consultasErro: apiErro,
          ultimaAtividade: apiUltima,
          edgeFunctionPath: "consultas-api",
          endpoint: null,
          icone: Search,
          configurado: !!consultasConfig.data?.api_token,
          podeEditar: !!consultasConfig.data,
          podeExcluir: !!consultasConfig.data,
          tabelaOrigem: "consultas_config",
          detalhes: {
            provedor: consultasConfig.data?.provedor,
            ambiente: consultasConfig.data?.ambiente,
            creditos: consultasConfig.data?.creditos_disponiveis,
          },
        },
        {
          id: "brasil-api",
          nome: "BrasilAPI",
          descricao: "Consulta de CNPJ, CEP e dados públicos",
          status: "ativo",
          totalConsultas: brasilApiConsultas.length,
          consultasSucesso: brasilApiSucesso,
          consultasErro: brasilApiErro,
          ultimaAtividade: brasilApiUltima,
          edgeFunctionPath: "consultas-brasilapi",
          endpoint: "https://brasilapi.com.br",
          icone: Globe,
          configurado: true,
          podeEditar: false,
          podeExcluir: false,
          tabelaOrigem: null,
          detalhes: {
            provedor: "BrasilAPI",
            ambiente: "producao",
          },
        },
      ];

      return integrations;
    },
  });

  return query;
}

export function useDeleteAutomacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tabelaOrigem }: { id: string; tabelaOrigem: string }) => {
      let error = null;

      if (tabelaOrigem === "meta_connections") {
        const result = await supabase.from("meta_connections").delete().neq("id", "");
        error = result.error;
      } else if (tabelaOrigem === "whatsapp_config") {
        const result = await supabase.from("whatsapp_config").delete().neq("id", "");
        error = result.error;
      } else if (tabelaOrigem === "consultas_config") {
        const result = await supabase.from("consultas_config").delete().neq("id", "");
        error = result.error;
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automacoes"] });
      toast({
        title: "Integração excluída",
        description: "A integração foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAutomacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tabelaOrigem,
      data,
    }: {
      tabelaOrigem: string;
      data: Record<string, unknown>;
    }) => {
      let error = null;

      if (tabelaOrigem === "meta_connections") {
        const result = await supabase
          .from("meta_connections")
          .update({ ...data, updated_at: new Date().toISOString() })
          .neq("id", "");
        error = result.error;
      } else if (tabelaOrigem === "whatsapp_config") {
        const result = await supabase
          .from("whatsapp_config")
          .update({ ...data, updated_at: new Date().toISOString() })
          .neq("id", "");
        error = result.error;
      } else if (tabelaOrigem === "consultas_config") {
        const result = await supabase
          .from("consultas_config")
          .update({ ...data, updated_at: new Date().toISOString() })
          .neq("id", "");
        error = result.error;
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automacoes"] });
      toast({
        title: "Integração atualizada",
        description: "As configurações foram salvas com sucesso.",
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
