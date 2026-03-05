import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { periodo, descricao_manual } = await req.json();

    // Calculate date range
    const now = new Date();
    let dataInicio: Date;
    const dataFim = now;

    if (periodo === "dia") {
      dataInicio = new Date(now);
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === "semana") {
      dataInicio = new Date(now);
      dataInicio.setDate(now.getDate() - 7);
    } else {
      dataInicio = new Date(now);
      dataInicio.setMonth(now.getMonth() - 1);
    }

    const dataInicioStr = dataInicio.toISOString();
    const dataFimStr = dataFim.toISOString();

    // Query logs_sistema using service role for full access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: logs, error: logsError } = await supabaseAdmin
      .from("logs_sistema")
      .select("acao, entidade_tipo, descricao, created_at")
      .gte("created_at", dataInicioStr)
      .lte("created_at", dataFimStr)
      .order("created_at", { ascending: false })
      .limit(500);

    if (logsError) {
      console.error("Error fetching logs:", logsError);
      return new Response(JSON.stringify({ error: "Erro ao buscar logs do sistema" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group logs by entity and action
    const summary: Record<string, Record<string, number>> = {};
    for (const log of logs || []) {
      const entity = log.entidade_tipo || "outro";
      const action = log.acao || "outro";
      if (!summary[entity]) summary[entity] = {};
      summary[entity][action] = (summary[entity][action] || 0) + 1;
    }

    const periodoLabel = periodo === "dia" ? "hoje" : periodo === "semana" ? "última semana" : "último mês";
    const summaryText = Object.entries(summary)
      .map(([entity, actions]) => {
        const actionsStr = Object.entries(actions)
          .map(([action, count]) => `${action}: ${count}`)
          .join(", ");
        return `- ${entity}: ${actionsStr}`;
      })
      .join("\n");

    if (!summaryText && !descricao_manual) {
      const conteudo = `Não houve alterações registradas no sistema durante o período selecionado (${periodoLabel}). Dica: descreva manualmente as melhorias feitas no campo de texto.`;
      
      const { error: insertError } = await supabaseAdmin
        .from("atualizacoes_sistema")
        .insert({
          periodo,
          data_inicio: dataInicio.toISOString().split("T")[0],
          data_fim: dataFim.toISOString().split("T")[0],
          conteudo,
          created_by: userId,
          descricao_manual: descricao_manual || null,
        });

      if (insertError) console.error("Insert error:", insertError);

      return new Response(JSON.stringify({ conteudo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build user prompt with manual description + logs
    let userPromptParts: string[] = [];
    
    if (descricao_manual) {
      userPromptParts.push(`Melhorias implementadas pela equipe durante ${periodoLabel}:\n${descricao_manual}`);
    }
    
    if (summaryText) {
      userPromptParts.push(`Atividades automáticas registradas no sistema (use como complemento, traduza nomes técnicos):\n${summaryText}\n\nReferência de tradução de nomes técnicos:\n- contact_submissions = gestão de clientes/leads\n- processos = processos jurídicos\n- demandas_internas = tarefas internas\n- parcelas_financeiras = gestão financeira\n- acordos_financeiros = acordos/contratos financeiros\n- contratos_gerados = documentos e contratos\n- despesas = controle de despesas\n- logs_sistema = monitoramento do sistema`);
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é uma assistente de comunicação de um escritório de advocacia chamado B&Z Advocacia. 
Sua função é transformar as informações recebidas em um texto profissional, acessível e amigável para ser enviado aos clientes do escritório via WhatsApp ou e-mail.

Regras:
- PRIORIZE as melhorias descritas manualmente pela equipe — elas são o conteúdo principal
- Use os logs automáticos apenas como complemento (se houver)
- Escreva em português brasileiro formal mas acessível
- Use linguagem positiva focada em melhorias e benefícios para o cliente
- Não mencione termos técnicos como "logs", "banco de dados", "tabelas", "CRUD", "edge functions"
- Traduza nomes técnicos de tabelas para linguagem acessível
- Organize em tópicos com emojis discretos
- Comece com uma saudação e termine com uma frase motivadora
- Mantenha o texto conciso (máximo 300 palavras)
- Mencione o período analisado
- Foque nas melhorias que impactam a experiência do cliente`
          },
          {
            role: "user",
            content: userPromptParts.join("\n\n")
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao gerar análise com IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const conteudo = aiData.choices?.[0]?.message?.content || "Não foi possível gerar a análise.";

    // Save to database
    const { error: insertError } = await supabaseAdmin
      .from("atualizacoes_sistema")
      .insert({
        periodo,
        data_inicio: dataInicio.toISOString().split("T")[0],
        data_fim: dataFim.toISOString().split("T")[0],
        conteudo,
        created_by: userId,
        descricao_manual: descricao_manual || null,
      });

    if (insertError) console.error("Insert error:", insertError);

    return new Response(JSON.stringify({ conteudo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
