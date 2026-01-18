import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

// Mapa de siglas de tribunais
const TRIBUNAIS: Record<string, string> = {
  // Tribunais Superiores
  stf: "Supremo Tribunal Federal",
  stj: "Superior Tribunal de Justiça",
  tst: "Tribunal Superior do Trabalho",
  tse: "Tribunal Superior Eleitoral",
  stm: "Superior Tribunal Militar",
  
  // Tribunais Regionais Federais
  trf1: "TRF 1ª Região",
  trf2: "TRF 2ª Região",
  trf3: "TRF 3ª Região",
  trf4: "TRF 4ª Região",
  trf5: "TRF 5ª Região",
  trf6: "TRF 6ª Região",
  
  // Tribunais de Justiça Estaduais
  tjac: "TJ Acre",
  tjal: "TJ Alagoas",
  tjam: "TJ Amazonas",
  tjap: "TJ Amapá",
  tjba: "TJ Bahia",
  tjce: "TJ Ceará",
  tjdft: "TJ Distrito Federal",
  tjes: "TJ Espírito Santo",
  tjgo: "TJ Goiás",
  tjma: "TJ Maranhão",
  tjmg: "TJ Minas Gerais",
  tjms: "TJ Mato Grosso do Sul",
  tjmt: "TJ Mato Grosso",
  tjpa: "TJ Pará",
  tjpb: "TJ Paraíba",
  tjpe: "TJ Pernambuco",
  tjpi: "TJ Piauí",
  tjpr: "TJ Paraná",
  tjrj: "TJ Rio de Janeiro",
  tjrn: "TJ Rio Grande do Norte",
  tjro: "TJ Rondônia",
  tjrr: "TJ Roraima",
  tjrs: "TJ Rio Grande do Sul",
  tjsc: "TJ Santa Catarina",
  tjse: "TJ Sergipe",
  tjsp: "TJ São Paulo",
  tjto: "TJ Tocantins",
  
  // Tribunais Regionais do Trabalho
  trt1: "TRT 1ª Região (RJ)",
  trt2: "TRT 2ª Região (SP)",
  trt3: "TRT 3ª Região (MG)",
  trt4: "TRT 4ª Região (RS)",
  trt5: "TRT 5ª Região (BA)",
  trt6: "TRT 6ª Região (PE)",
  trt7: "TRT 7ª Região (CE)",
  trt8: "TRT 8ª Região (PA/AP)",
  trt9: "TRT 9ª Região (PR)",
  trt10: "TRT 10ª Região (DF/TO)",
  trt11: "TRT 11ª Região (AM/RR)",
  trt12: "TRT 12ª Região (SC)",
  trt13: "TRT 13ª Região (PB)",
  trt14: "TRT 14ª Região (RO/AC)",
  trt15: "TRT 15ª Região (Campinas)",
  trt16: "TRT 16ª Região (MA)",
  trt17: "TRT 17ª Região (ES)",
  trt18: "TRT 18ª Região (GO)",
  trt19: "TRT 19ª Região (AL)",
  trt20: "TRT 20ª Região (SE)",
  trt21: "TRT 21ª Região (RN)",
  trt22: "TRT 22ª Região (PI)",
  trt23: "TRT 23ª Região (MT)",
  trt24: "TRT 24ª Região (MS)",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("DATAJUD_API_KEY");
    if (!apiKey) {
      console.error("DATAJUD_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API não configurada", status: "api_nao_configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header for user identification
    const authHeader = req.headers.get("authorization");
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    const { numeroProcesso, tribunal, processo_id, motivo, justificativa } = await req.json();

    console.log("Consulta Datajud recebida:", { numeroProcesso, tribunal, processo_id, motivo });

    if (!numeroProcesso || !tribunal) {
      return new Response(
        JSON.stringify({ error: "Número do processo e tribunal são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!motivo || !justificativa) {
      return new Response(
        JSON.stringify({ error: "Motivo e justificativa são obrigatórios para LGPD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Remove formatting from process number
    const numeroLimpo = numeroProcesso.replace(/[^\d]/g, "");
    
    console.log(`Consultando processo ${numeroLimpo} no tribunal ${tribunal}`);

    // Make request to Datajud API
    const datajudUrl = `${DATAJUD_BASE_URL}/api_publica_${tribunal.toLowerCase()}/_search`;
    
    const datajudResponse = await fetch(datajudUrl, {
      method: "POST",
      headers: {
        "Authorization": `APIKey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          match: {
            numeroProcesso: numeroLimpo,
          },
        },
        size: 1,
      }),
    });

    console.log("Status da resposta Datajud:", datajudResponse.status);

    if (!datajudResponse.ok) {
      const errorText = await datajudResponse.text();
      console.error("Erro na API Datajud:", errorText);
      
      // Log the failed consultation
      if (userId) {
        await supabase.from("consultas_realizadas").insert({
          tipo_consulta: "processo",
          parametro_busca: numeroProcesso,
          processo_id: processo_id || null,
          usuario_id: userId,
          motivo,
          justificativa,
          status: "erro",
          mensagem_erro: `Erro ${datajudResponse.status}: ${errorText.substring(0, 200)}`,
          custo: 0,
        });
      }

      return new Response(
        JSON.stringify({ 
          error: `Erro ao consultar API Datajud: ${datajudResponse.status}`,
          status: "erro",
          detalhes: errorText.substring(0, 200)
        }),
        { status: datajudResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const datajudData = await datajudResponse.json();
    console.log("Resposta Datajud:", JSON.stringify(datajudData).substring(0, 500));

    const hits = datajudData.hits?.hits || [];
    
    if (hits.length === 0) {
      // Log consultation with no results
      if (userId) {
        await supabase.from("consultas_realizadas").insert({
          tipo_consulta: "processo",
          parametro_busca: numeroProcesso,
          processo_id: processo_id || null,
          usuario_id: userId,
          motivo,
          justificativa,
          status: "sem_dados",
          custo: 0,
        });
      }

      return new Response(
        JSON.stringify({ 
          error: "Processo não encontrado",
          status: "sem_dados",
          tribunal: TRIBUNAIS[tribunal.toLowerCase()] || tribunal
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processoData = hits[0]._source;
    
    // Format the response
    const resultado = {
      processo: {
        numeroProcesso: processoData.numeroProcesso || numeroProcesso,
        classe: processoData.classe?.nome || processoData.classeProcessual || "Não informada",
        classeCompleta: processoData.classe || null,
        tribunal: TRIBUNAIS[tribunal.toLowerCase()] || tribunal.toUpperCase(),
        tribunalSigla: tribunal.toUpperCase(),
        dataAjuizamento: processoData.dataAjuizamento || null,
        dataHoraUltimaAtualizacao: processoData.dataHoraUltimaAtualizacao || null,
        grau: processoData.grau || "Não informado",
        nivelSigilo: processoData.nivelSigilo || 0,
        formato: processoData.formato?.nome || "Eletrônico",
        sistema: processoData.sistema?.nome || null,
        orgaoJulgador: processoData.orgaoJulgador ? {
          nome: processoData.orgaoJulgador.nome || "Não informado",
          codigo: processoData.orgaoJulgador.codigo || null,
          codigoMunicipioIBGE: processoData.orgaoJulgador.codigoMunicipioIBGE || null,
        } : null,
        assuntos: (processoData.assuntos || []).map((a: any) => ({
          codigo: a.codigo || null,
          nome: a.nome || "Não informado",
        })),
        movimentos: (processoData.movimentos || []).slice(0, 20).map((m: any) => ({
          codigo: m.codigo || null,
          nome: m.nome || "Movimentação",
          dataHora: m.dataHora || null,
          complementosTabelados: m.complementosTabelados || [],
        })),
      },
      metadados: {
        consultadoEm: new Date().toISOString(),
        idConsulta: crypto.randomUUID(),
        tribunal: tribunal.toUpperCase(),
        tribunalNome: TRIBUNAIS[tribunal.toLowerCase()] || tribunal.toUpperCase(),
      },
    };

    // Log successful consultation
    if (userId) {
      await supabase.from("consultas_realizadas").insert({
        tipo_consulta: "processo",
        parametro_busca: numeroProcesso,
        processo_id: processo_id || null,
        usuario_id: userId,
        motivo,
        justificativa,
        status: "sucesso",
        resultado,
        custo: 0,
        id_consulta_externa: resultado.metadados.idConsulta,
      });
    }

    console.log("Consulta Datajud concluída com sucesso");

    return new Response(
      JSON.stringify(resultado),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error("Erro na edge function consultas-datajud:", error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        status: "erro"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
