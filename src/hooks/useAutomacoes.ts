import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gavel, Target, MessageSquare, Search, Globe, LucideIcon } from "lucide-react";

export interface ApiIntegration {
  id: string;
  nome: string;
  descricao: string;
  status: 'ativo' | 'pendente' | 'inativo' | 'erro';
  totalConsultas: number;
  consultasSucesso: number;
  consultasErro: number;
  ultimaAtividade: string | null;
  edgeFunctionPath: string;
  endpoint: string;
  icone: LucideIcon;
  configurado: boolean;
  detalhes: {
    apiKeyMasked?: string;
    ambiente?: string;
    accountId?: string;
    accountName?: string;
    rateLimit?: string;
  };
}

export function useAutomacoes() {
  return useQuery({
    queryKey: ["automacoes"],
    queryFn: async (): Promise<ApiIntegration[]> => {
      // Fetch all configurations in parallel
      const [
        consultasConfigResult,
        metaConnectionResult,
        whatsappConfigResult,
        consultasRealizadasResult,
      ] = await Promise.all([
        supabase.from("consultas_config").select("*").single(),
        supabase.from("meta_connections").select("*").order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("whatsapp_config").select("*").single(),
        supabase.from("consultas_realizadas").select("id, tipo_consulta, status, created_at"),
      ]);

      const consultasConfig = consultasConfigResult.data;
      const metaConnection = metaConnectionResult.data;
      const whatsappConfig = whatsappConfigResult.data;
      const consultas = consultasRealizadasResult.data || [];

      // Count consultations by type
      const datajudConsultas = consultas.filter(c => c.tipo_consulta === "processo");
      const pessoaConsultas = consultas.filter(c => c.tipo_consulta === "pessoa");
      const imovelConsultas = consultas.filter(c => c.tipo_consulta === "imovel");
      const veiculoConsultas = consultas.filter(c => c.tipo_consulta === "veiculo");
      const cnpjConsultas = consultas.filter(c => c.tipo_consulta === "cnpj");
      const cepConsultas = consultas.filter(c => c.tipo_consulta === "cep");
      const consultasApiTotal = [...pessoaConsultas, ...imovelConsultas, ...veiculoConsultas];
      const brasilApiTotal = [...cnpjConsultas, ...cepConsultas];

      // Helper to get last activity
      const getLastActivity = (items: typeof consultas) => {
        if (items.length === 0) return null;
        const sorted = [...items].sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        return sorted[0]?.created_at || null;
      };

      // Helper to count success/error
      const countByStatus = (items: typeof consultas) => ({
        sucesso: items.filter(c => c.status === "sucesso").length,
        erro: items.filter(c => c.status === "erro").length,
      });

      const datajudStats = countByStatus(datajudConsultas);
      const consultasApiStats = countByStatus(consultasApiTotal);
      const brasilApiStats = countByStatus(brasilApiTotal);

      const integrations: ApiIntegration[] = [
        {
          id: "datajud",
          nome: "Datajud (CNJ)",
          descricao: "API pública do Conselho Nacional de Justiça para consulta de processos judiciais",
          status: "ativo", // We assume it's active since it uses a secret
          totalConsultas: datajudConsultas.length,
          consultasSucesso: datajudStats.sucesso,
          consultasErro: datajudStats.erro,
          ultimaAtividade: getLastActivity(datajudConsultas),
          edgeFunctionPath: "supabase/functions/consultas-datajud/index.ts",
          endpoint: "https://api-publica.datajud.cnj.jus.br",
          icone: Gavel,
          configurado: true, // Secret DATAJUD_API_KEY exists
          detalhes: {
            apiKeyMasked: "••••••••••••dw==",
            rateLimit: "120 requisições/minuto",
          },
        },
        {
          id: "meta-ads",
          nome: "Meta Ads",
          descricao: "Integração com Facebook/Instagram Ads para gestão de campanhas publicitárias",
          status: metaConnection?.status === "connected" ? "ativo" : metaConnection ? "pendente" : "inativo",
          totalConsultas: 0, // Meta doesn't track in consultas_realizadas
          consultasSucesso: 0,
          consultasErro: 0,
          ultimaAtividade: metaConnection?.ultima_sincronizacao || null,
          edgeFunctionPath: "supabase/functions/meta-campaigns/index.ts",
          endpoint: "https://graph.facebook.com/v18.0",
          icone: Target,
          configurado: !!metaConnection,
          detalhes: {
            accountId: metaConnection?.account_id,
            accountName: metaConnection?.account_name || undefined,
          },
        },
        {
          id: "whatsapp",
          nome: "WhatsApp Business",
          descricao: "API do WhatsApp Business para envio de mensagens e notificações",
          status: whatsappConfig?.active ? "ativo" : whatsappConfig ? "pendente" : "inativo",
          totalConsultas: 0,
          consultasSucesso: 0,
          consultasErro: 0,
          ultimaAtividade: whatsappConfig?.updated_at || null,
          edgeFunctionPath: "supabase/functions/whatsapp-send/index.ts",
          endpoint: "https://graph.facebook.com/v18.0",
          icone: MessageSquare,
          configurado: !!whatsappConfig?.phone_number_id,
          detalhes: {
            apiKeyMasked: whatsappConfig?.phone_number_id ? "••••••••••••" : undefined,
          },
        },
        {
          id: "consultas-api",
          nome: "API de Consultas",
          descricao: "Consultas de pessoas, veículos e imóveis via BigDataCorp ou similar",
          status: consultasConfig?.ativo ? "ativo" : consultasConfig ? "pendente" : "inativo",
          totalConsultas: consultasApiTotal.length,
          consultasSucesso: consultasApiStats.sucesso,
          consultasErro: consultasApiStats.erro,
          ultimaAtividade: getLastActivity(consultasApiTotal),
          edgeFunctionPath: "supabase/functions/consultas-api/index.ts",
          endpoint: consultasConfig?.ambiente === "producao" 
            ? "https://plataforma.bigdatacorp.com.br" 
            : "https://sandbox.bigdatacorp.com.br",
          icone: Search,
          configurado: !!consultasConfig?.api_token,
          detalhes: {
            apiKeyMasked: consultasConfig?.api_token ? "••••••••••••" : undefined,
            ambiente: consultasConfig?.ambiente || "sandbox",
          },
        },
        {
          id: "brasilapi",
          nome: "BrasilAPI",
          descricao: "API pública para consulta de CNPJ, CEP e dados públicos brasileiros",
          status: "ativo", // Always active (public API, no authentication required)
          totalConsultas: brasilApiTotal.length,
          consultasSucesso: brasilApiStats.sucesso,
          consultasErro: brasilApiStats.erro,
          ultimaAtividade: getLastActivity(brasilApiTotal),
          edgeFunctionPath: "supabase/functions/consultas-brasilapi/index.ts",
          endpoint: "https://brasilapi.com.br/api",
          icone: Globe,
          configurado: true, // No configuration required
          detalhes: {
            rateLimit: "Ilimitado (uso responsável)",
            ambiente: "producao",
          },
        },
      ];

      return integrations;
    },
  });
}
