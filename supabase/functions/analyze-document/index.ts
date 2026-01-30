import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { content, tipo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "Configuração de IA não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Conteúdo do documento é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analisando documento do tipo: ${tipo}`);
    console.log(`Tamanho do conteúdo: ${content.length} caracteres`);

    const systemPrompt = `Você é um assistente jurídico especializado em análise de documentos legais brasileiros.
Analise o documento fornecido e extraia as seguintes informações:

1. **servico_padrao**: Uma descrição concisa do serviço jurídico principal mencionado (máximo 200 caracteres). Deve começar com "assessoria jurídica em..." ou similar.

2. **tipo_identificado**: Identifique a área do direito. Use APENAS um destes valores:
   - "saude" (ações contra planos de saúde, medicamentos, tratamentos)
   - "familia" (divórcio, guarda, alimentos, inventário)
   - "civel" (indenizações, contratos, obrigações)
   - "trabalhista" (reclamações trabalhistas, rescisões)
   - "consumidor" (relações de consumo, CDC)
   - "previdenciario" (INSS, aposentadoria, benefícios)

3. **descricao_modelo**: Uma breve descrição do modelo que será criado (máximo 100 caracteres).

4. **variaveis**: Lista de variáveis que podem ser personalizadas. Inclua sempre:
   - "valor_entrada"
   - "percentual_exito"
   Adicione outras variáveis relevantes encontradas no documento.

Responda APENAS com um objeto JSON válido, sem markdown ou explicações adicionais.

Exemplo de resposta:
{
  "servico_padrao": "assessoria jurídica em ação de obrigação de fazer contra plano de saúde para cobertura de tratamento",
  "tipo_identificado": "saude",
  "descricao_modelo": "Modelo para ações de saúde contra operadoras de planos",
  "variaveis": ["valor_entrada", "percentual_exito", "nome_plano", "procedimento"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analise este documento (tipo: ${tipo || 'proposta'}):\n\n${content.substring(0, 10000)}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API de IA:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao analisar documento com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error("Resposta vazia da IA");
      return new Response(
        JSON.stringify({ error: "Resposta vazia da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Resposta da IA:", aiContent);

    // Parse do JSON da resposta
    let parsedResult;
    try {
      // Remove possíveis marcadores de código markdown
      const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Erro ao fazer parse da resposta:", parseError);
      console.error("Conteúdo recebido:", aiContent);
      return new Response(
        JSON.stringify({ error: "Erro ao processar resposta da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar campos obrigatórios
    const result = {
      servico_padrao: parsedResult.servico_padrao || "assessoria jurídica especializada",
      tipo_identificado: parsedResult.tipo_identificado || "civel",
      descricao_modelo: parsedResult.descricao_modelo || "Modelo personalizado",
      variaveis: parsedResult.variaveis || ["valor_entrada", "percentual_exito"],
    };

    console.log("Resultado final:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na edge function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
