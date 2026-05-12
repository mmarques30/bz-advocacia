// Cliente Anthropic (Claude) — usado para classificar/interpretar respostas do lead.
// Doc: https://docs.claude.com/en/api/messages

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
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
