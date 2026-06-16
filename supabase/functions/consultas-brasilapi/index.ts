import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ConsultaCNPJRequest {
  tipo: "cnpj" | "cep";
  valor: string;
  processo_id?: string;
  motivo: string;
  justificativa: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ConsultaCNPJRequest = await req.json();
    const { tipo, valor, processo_id, motivo, justificativa } = body;

    console.log(`[BrasilAPI] Consulta ${tipo}: ${valor} por usuário ${user.id}`);

    // Validate input
    if (!valor || !motivo || !justificativa) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios não informados" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean the value (remove special characters)
    const valorLimpo = valor.replace(/\D/g, "");

    let apiUrl: string;
    let tipoConsulta: string;

    if (tipo === "cnpj") {
      if (valorLimpo.length !== 14) {
        return new Response(
          JSON.stringify({ error: "CNPJ deve ter 14 dígitos" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      apiUrl = `https://brasilapi.com.br/api/cnpj/v1/${valorLimpo}`;
      tipoConsulta = "cnpj";
    } else if (tipo === "cep") {
      if (valorLimpo.length !== 8) {
        return new Response(
          JSON.stringify({ error: "CEP deve ter 8 dígitos" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      apiUrl = `https://brasilapi.com.br/api/cep/v2/${valorLimpo}`;
      tipoConsulta = "cep";
    } else {
      return new Response(
        JSON.stringify({ error: "Tipo de consulta inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[BrasilAPI] Fetching: ${apiUrl}`);

    // Make request to BrasilAPI
    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    const consultaId = crypto.randomUUID();
    const consultadoEm = new Date().toISOString();

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`[BrasilAPI] Error ${apiResponse.status}: ${errorText}`);

      // Log failed consultation
      await supabase.from("consultas_realizadas").insert({
        id: consultaId,
        tipo_consulta: tipoConsulta,
        parametro_busca: valorLimpo,
        processo_id: processo_id || null,
        usuario_id: user.id,
        motivo,
        justificativa,
        status: apiResponse.status === 404 ? "sem_dados" : "erro",
        mensagem_erro: `HTTP ${apiResponse.status}: ${errorText}`,
        custo: 0,
        id_consulta_externa: null,
      });

      if (apiResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            status: "sem_dados",
            mensagem: tipo === "cnpj" 
              ? "CNPJ não encontrado na base da Receita Federal" 
              : "CEP não encontrado"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao consultar BrasilAPI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiData = await apiResponse.json();
    console.log(`[BrasilAPI] Success for ${tipo}: ${valorLimpo}`);

    // Format response based on type
    let formattedData;

    if (tipo === "cnpj") {
      formattedData = {
        dados: {
          cnpj: apiData.cnpj,
          razaoSocial: apiData.razao_social,
          nomeFantasia: apiData.nome_fantasia,
          situacaoCadastral: apiData.descricao_situacao_cadastral,
          dataSituacao: apiData.data_situacao_cadastral,
          dataAbertura: apiData.data_inicio_atividade,
          naturezaJuridica: apiData.natureza_juridica,
          porte: apiData.porte,
          capitalSocial: apiData.capital_social,
          endereco: {
            logradouro: apiData.logradouro,
            numero: apiData.numero,
            complemento: apiData.complemento,
            bairro: apiData.bairro,
            municipio: apiData.municipio,
            uf: apiData.uf,
            cep: apiData.cep,
          },
          atividadePrincipal: {
            codigo: apiData.cnae_fiscal,
            descricao: apiData.cnae_fiscal_descricao,
          },
          atividadesSecundarias: (apiData.cnaes_secundarios || []).map((cnae: any) => ({
            codigo: cnae.codigo,
            descricao: cnae.descricao,
          })),
          qsa: (apiData.qsa || []).map((socio: any) => ({
            nome: socio.nome_socio,
            qualificacao: socio.qualificacao_socio,
            dataEntrada: socio.data_entrada_sociedade,
          })),
          contato: {
            telefone: apiData.ddd_telefone_1 || apiData.ddd_telefone_2,
            email: apiData.email,
          },
          simplesNacional: {
            optante: apiData.opcao_pelo_simples || false,
            dataOpcao: apiData.data_opcao_pelo_simples,
          },
          mei: {
            optante: apiData.opcao_pelo_mei || false,
          },
        },
        metadados: {
          consultadoEm,
          fonte: "BrasilAPI (Receita Federal)",
          idConsulta: consultaId,
        },
      };
    } else {
      // CEP response
      formattedData = {
        dados: {
          cep: apiData.cep,
          logradouro: apiData.street,
          bairro: apiData.neighborhood,
          cidade: apiData.city,
          uf: apiData.state,
          localizacao: apiData.location ? {
            latitude: apiData.location.coordinates?.latitude,
            longitude: apiData.location.coordinates?.longitude,
          } : null,
        },
        metadados: {
          consultadoEm,
          fonte: "BrasilAPI",
          idConsulta: consultaId,
        },
      };
    }

    // Log successful consultation. Antes o erro era silenciado e a
    // pagina Historico mostrava zero consultas mesmo apos o usuario
    // executar varias buscas (o CHECK constraint da tabela rejeitava
    // 'cnpj'/'cep'). Agora capturamos e logamos pra ficar visivel se
    // RLS, schema cache ou outro motivo bloquear o insert.
    const { error: insertSuccessErr } = await supabase
      .from("consultas_realizadas")
      .insert({
        id: consultaId,
        tipo_consulta: tipoConsulta,
        parametro_busca: valorLimpo,
        processo_id: processo_id || null,
        usuario_id: user.id,
        motivo,
        justificativa,
        resultado: formattedData,
        status: "sucesso",
        custo: 0,
        id_consulta_externa: consultaId,
      });
    if (insertSuccessErr) {
      console.error("[BrasilAPI] insert consultas_realizadas falhou:", insertSuccessErr);
    }

    return new Response(
      JSON.stringify(formattedData),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[BrasilAPI] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
