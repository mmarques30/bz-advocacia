// Cliente Anthropic (Claude) — usado para classificar/interpretar respostas do lead.
// Doc: https://docs.claude.com/en/api/messages
//
// Chave: o secret ativo hoje se chama ANTHROPIC_API_V2 (rotacionado em
// jul/2026). As antigas ANTHROPIC_API_KEY e CLOUD_API_KEY continuam
// existindo no Supabase mas NAO devem ser usadas — projeto anterior
// revogado pela Mariana. Le so V2; se faltar, o classificador falha
// explicito e a msg vai pro log em vez de tentar chaves mortas.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_V2") ?? "";
const MODEL = Deno.env.get("CLAUDE_MODEL") ?? "claude-haiku-4-5-20251001";

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeJsonResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  rawText?: string;
}

/**
 * Chama Claude pedindo SAÍDA EM JSON.
 * O prompt do sistema já deve instruir o formato JSON desejado.
 * O parser tolera blocos markdown ```json e texto antes/depois.
 */
export async function claudeJson<T>(
  systemPrompt: string,
  userMessages: ClaudeMessage[],
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<ClaudeJsonResult<T>> {
  // Guard: sem V2 configurado, retorna erro claro em vez de mandar
  // header vazio pra Anthropic (que responde 401 confuso).
  if (!ANTHROPIC_API_KEY) {
    return {
      ok: false,
      error: "ANTHROPIC_API_V2 nao configurado no Supabase. Verifique Settings > Edge Functions > Secrets.",
    };
  }

  const body = {
    model: MODEL,
    max_tokens: options.maxTokens ?? 1024,
    temperature: options.temperature ?? 0.2,
    system: systemPrompt,
    messages: userMessages,
  };

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    return { ok: false, error: `Claude API ${resp.status}: ${errText}` };
  }

  const payload = await resp.json();
  const text: string = payload?.content?.[0]?.text ?? "";

  // Extrai bloco JSON da resposta
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { ok: false, error: "Resposta sem JSON", rawText: text };
  }

  try {
    const data = JSON.parse(jsonMatch[0]) as T;
    return { ok: true, data, rawText: text };
  } catch (e) {
    return { ok: false, error: `Erro de parse: ${e}`, rawText: text };
  }
}
