// Cliente Z-API — envia mensagens de texto via WhatsApp.
// Documentação: https://developer.z-api.io

const Z_API_INSTANCE = Deno.env.get("ZAPI_INSTANCE_ID")!;
const Z_API_TOKEN = Deno.env.get("ZAPI_TOKEN")!;
const Z_API_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN")!; // Security token da conta Z-API

const BASE_URL = `https://api.z-api.io/instances/${Z_API_INSTANCE}/token/${Z_API_TOKEN}`;

export interface ZapiSendTextResult {
  ok: boolean;
  status: number;
  messageId?: string;
  raw?: unknown;
}

/**
 * Normaliza telefone para o formato exigido pela Z-API.
 * Aceita "+5511999999999", "5511999999999", "(11) 99999-9999", etc.
 * Retorna apenas dígitos com DDI 55 garantido.
 */
export function normalizarTelefone(telefone: string): string {
  let limpo = telefone.replace(/\D/g, "");
  if (limpo.startsWith("0")) limpo = limpo.replace(/^0+/, "");
  if (!limpo.startsWith("55")) limpo = "55" + limpo;
  return limpo;
}

/**
 * Envia mensagem de texto via Z-API.
 */
export async function zapiSendText(
  telefone: string,
  message: string,
): Promise<ZapiSendTextResult> {
  const phone = normalizarTelefone(telefone);
  const url = `${BASE_URL}/send-text`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": Z_API_CLIENT_TOKEN,
    },
    body: JSON.stringify({ phone, message }),
  });

  const raw = await resp.json().catch(() => null);

  return {
    ok: resp.ok,
    status: resp.status,
    messageId: raw?.messageId,
    raw,
  };
}

/**
 * Envia múltiplas mensagens em sequência (com pequena pausa entre elas
 * para o WhatsApp não tratar como spam).
 */
export async function zapiSendSequence(
  telefone: string,
  messages: string[],
  delayMs = 1500,
): Promise<ZapiSendTextResult[]> {
  const results: ZapiSendTextResult[] = [];
  for (const m of messages) {
    const r = await zapiSendText(telefone, m);
    results.push(r);
    if (delayMs > 0) await new Promise((res) => setTimeout(res, delayMs));
  }
  return results;
}
