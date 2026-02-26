import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const { message, conversationId } = await req.json();
    if (!message) throw new Error("Message is required");

    // Use service role client to query all data
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Save user message
    await adminClient.from("chat_messages").insert({
      user_id: userId,
      role: "user",
      content: message,
      conversation_id: conversationId,
    });

    // Load conversation history
    const { data: history } = await adminClient
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Gather business context
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [
      leadsRes,
      leadsByStage,
      processosRes,
      demandasRes,
      demandasAtrasadas,
      parcelasRes,
      prazosRes,
      despesasRes,
      acordosRes,
    ] = await Promise.all([
      adminClient.from("contact_submissions").select("id, status, estagio, created_at, tipo_processo, nome_completo", { count: "exact" }),
      adminClient.from("contact_submissions").select("estagio"),
      adminClient.from("processos").select("id, status, tipo, numero_processo, lead_id", { count: "exact" }),
      adminClient.from("demandas_internas").select("id, titulo, status, prioridade, data_limite, advogada_responsavel", { count: "exact" }),
      adminClient.from("demandas_internas").select("id, titulo, data_limite, advogada_responsavel").lt("data_limite", now.toISOString().split("T")[0]).in("status", ["pendente", "em_andamento"]),
      adminClient.from("parcelas_financeiras").select("id, valor, status, data_vencimento").eq("status", "pendente"),
      adminClient.from("processos_prazos").select("id, descricao, data_prazo, tipo_prazo, status").lte("data_prazo", in7Days).eq("status", "pendente"),
      adminClient.from("despesas").select("id, valor, data, categoria").gte("data", startOfMonth),
      adminClient.from("acordos_financeiros").select("id, valor_total, status", { count: "exact" }),
    ]);

    // Build context summary
    const totalLeads = leadsRes.count || 0;
    const leadsThisMonth = (leadsRes.data || []).filter((l) => l.created_at >= startOfMonth).length;
    
    const stageCount: Record<string, number> = {};
    (leadsByStage.data || []).forEach((l) => {
      stageCount[l.estagio || "sem_estagio"] = (stageCount[l.estagio || "sem_estagio"] || 0) + 1;
    });

    const totalProcessos = processosRes.count || 0;
    const processosAtivos = (processosRes.data || []).filter((p) => p.status === "ativo" || p.status === "em_andamento").length;

    const totalDemandas = demandasRes.count || 0;
    const demandasPendentes = (demandasRes.data || []).filter((d) => d.status === "pendente").length;
    const demandasEmAndamento = (demandasRes.data || []).filter((d) => d.status === "em_andamento").length;
    const numAtrasadas = (demandasAtrasadas.data || []).length;

    const parcelasPendentes = parcelasRes.data || [];
    const totalPendente = parcelasPendentes.reduce((s, p) => s + Number(p.valor), 0);
    const parcelasAtrasadas = parcelasPendentes.filter((p) => p.data_vencimento < now.toISOString().split("T")[0]);
    const totalAtrasado = parcelasAtrasadas.reduce((s, p) => s + Number(p.valor), 0);

    const prazosProximos = prazosRes.data || [];

    const despesasMes = (despesasRes.data || []).reduce((s, d) => s + Number(d.valor), 0);

    const totalAcordos = acordosRes.count || 0;
    const acordosAtivos = (acordosRes.data || []).filter((a) => a.status === "ativo").length;

    const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const contextBlock = `
DADOS ATUAIS DO ESCRITÓRIO B&Z ADVOCACIA (${now.toLocaleDateString("pt-BR")}):

LEADS/CLIENTES:
- Total de leads: ${totalLeads}
- Leads este mês: ${leadsThisMonth}
- Por estágio: ${Object.entries(stageCount).map(([k, v]) => `${k}: ${v}`).join(", ")}

PROCESSOS:
- Total: ${totalProcessos}
- Ativos/Em andamento: ${processosAtivos}

DEMANDAS/TAREFAS:
- Total: ${totalDemandas}
- Pendentes: ${demandasPendentes}
- Em andamento: ${demandasEmAndamento}
- Atrasadas: ${numAtrasadas}
${numAtrasadas > 0 ? "- Tarefas atrasadas:\n" + (demandasAtrasadas.data || []).slice(0, 10).map((d) => `  · "${d.titulo}" (limite: ${d.data_limite}, resp: ${d.advogada_responsavel})`).join("\n") : ""}

FINANCEIRO:
- Parcelas pendentes: ${parcelasPendentes.length} (${fmtBRL(totalPendente)})
- Parcelas atrasadas: ${parcelasAtrasadas.length} (${fmtBRL(totalAtrasado)})
- Despesas no mês: ${fmtBRL(despesasMes)}
- Acordos totais: ${totalAcordos} (ativos: ${acordosAtivos})

PRAZOS (próximos 7 dias):
${prazosProximos.length > 0 ? prazosProximos.slice(0, 10).map((p) => `- ${p.descricao} (${p.data_prazo}, tipo: ${p.tipo_prazo})`).join("\n") : "- Nenhum prazo nos próximos 7 dias"}
`.trim();

    const systemPrompt = `Você é a assistente virtual do escritório B&Z Advocacia. Seu nome é Assistente B&Z.

PERSONALIDADE:
- Profissional, direta e objetiva
- Use bullets para organizar informações
- Sem emojis em excesso (máximo 1-2 por resposta, se necessário)
- Pontualmente use expressões gaúchas como "bah", "tchê", "guria" — mas de forma natural e esporádica, não a cada frase
- Trate as donas como "gurias" ocasionalmente

REGRAS:
- Sempre responda em português brasileiro
- Use os dados fornecidos abaixo para responder com precisão
- Se não tiver dados suficientes para responder, diga isso claramente
- Formate valores em BRL quando aplicável
- Use markdown para formatação (bold, listas, etc.)
- Seja concisa mas completa

${contextBlock}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m) => ({ role: m.role, content: m.content })),
    ];

    // Call AI Gateway with streaming
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    // We need to collect the full response to save it
    const reader = aiResponse.body!.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullAssistantResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIdx: number;
            while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIdx);
              buffer = buffer.slice(newlineIdx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) fullAssistantResponse += content;
              } catch { /* partial */ }
            }

            controller.enqueue(value);
          }

          // Save assistant response
          if (fullAssistantResponse) {
            await adminClient.from("chat_messages").insert({
              user_id: userId,
              role: "assistant",
              content: fullAssistantResponse,
              conversation_id: conversationId,
            });
          }
        } catch (e) {
          console.error("Stream error:", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
