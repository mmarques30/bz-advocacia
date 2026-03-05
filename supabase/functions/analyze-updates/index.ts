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

    const { periodo } = await req.json();

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

    const dataInicioDate = dataInicio.toISOString().split("T")[0];
    const dataFimDate = dataFim.toISOString().split("T")[0];

    // Query melhorias_registro
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: melhorias, error: melhoriasError } = await supabaseAdmin
      .from("melhorias_registro")
      .select("titulo, descricao, tipo, data_implementacao")
      .gte("data_implementacao", dataInicioDate)
      .lte("data_implementacao", dataFimDate)
      .order("data_implementacao", { ascending: false });

    if (melhoriasError) {
      console.error("Error fetching melhorias:", melhoriasError);
      return new Response(JSON.stringify({ error: "Erro ao buscar melhorias" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const periodoLabel = periodo === "dia" ? "hoje" : periodo === "semana" ? "última semana" : "último mês";

    if (!melhorias || melhorias.length === 0) {
      const conteudo = `Não houve melhorias registradas no período selecionado (${periodoLabel}).`;

      const { error: insertError } = await supabaseAdmin
        .from("atualizacoes_sistema")
        .insert({
          periodo,
          data_inicio: dataInicioDate,
          data_fim: dataFimDate,
          conteudo,
          created_by: userId,
        });

      if (insertError) console.error("Insert error:", insertError);

      return new Response(JSON.stringify({ conteudo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build melhorias text for AI
    const tipoLabel = (t: string) => {
      if (t === "correcao") return "🔧 Correção";
      if (t === "nova_funcionalidade") return "✨ Nova funcionalidade";
      return "⬆️ Melhoria";
    };

    const melhoriasText = melhorias
      .map((m) => `- [${tipoLabel(m.tipo)}] ${m.titulo}: ${m.descricao}`)
      .join("\n");

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
Sua função é transformar as melhorias técnicas do sistema em um texto profissional, acessível e amigável para ser enviado aos clientes do escritório via WhatsApp ou e-mail.

Regras:
- Escreva em português brasileiro formal mas acessível
- Use linguagem positiva focada em melhorias e benefícios para o cliente
- Não mencione termos técnicos como "logs", "banco de dados", "tabelas", "CRUD", "edge functions", "bug", "default value"
- Traduza correções técnicas em benefícios práticos para o cliente
- Organize em tópicos com emojis discretos
- Comece com uma saudação e termine com uma frase motivadora
- Mantenha o texto conciso (máximo 300 palavras)
- Mencione o período analisado
- Foque nas melhorias que impactam a experiência do cliente`
          },
          {
            role: "user",
            content: `Melhorias implementadas no sistema durante ${periodoLabel} (${melhorias.length} itens):\n\n${melhoriasText}`
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
        data_inicio: dataInicioDate,
        data_fim: dataFimDate,
        conteudo,
        created_by: userId,
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
