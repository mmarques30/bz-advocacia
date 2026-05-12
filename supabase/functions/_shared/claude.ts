// Cliente Anthropic (Claude)

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

export async function claudeJson<T>(
  systemPrompt: string,
  userMessages: ClaudeMessage[],
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<ClaudeJsonResult<T>> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.3,
      system: systemPrompt,
      messages: userMessages,
    }),
  });
  if (!resp.ok) {
    return { ok: false, error: `Claude ${resp.status}: ${await resp.text()}` };
  }
  const payload = await resp.json();
  const text: string = payload?.content?.[0]?.text ?? "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { ok: false, error: "Sem JSON", rawText: text };
  try {
    return { ok: true, data: JSON.parse(m[0]) as T, rawText: text };
  } catch (e) {
    return { ok: false, error: `Parse: ${e}`, rawText: text };
  }
}
