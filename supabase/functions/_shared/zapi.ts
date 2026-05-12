// Cliente Z-API — envia mensagens de texto via WhatsApp.

const Z_API_INSTANCE = Deno.env.get("ZAPI_INSTANCE_ID")!;
const Z_API_TOKEN = Deno.env.get("ZAPI_TOKEN")!;
const Z_API_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN")!;

const BASE_URL = `https://api.z-api.io/instances/${Z_API_INSTANCE}/token/${Z_API_TOKEN}`;

export interface ZapiSendResult {
  ok: boolean;
  status: number;
  messageId?: string;
  raw?: unknown;
}

export function normalizarTelefone(telefone: string): string {
  let limpo = telefone.replace(/\D/g, "");
  if (limpo.startsWith("0")) limpo = limpo.replace(/^0+/, "");
  if (!limpo.startsWith("55")) limpo = "55" + limpo;
  return limpo;
}

export function ehGrupo(payload: { phone?: string; isGroup?: boolean }): boolean {
  if (payload.isGroup === true) return true;
  if (payload.phone?.includes("@g.us")) return true;
  if (payload.phone && payload.phone.length > 18) return true;  // grupo costuma ter ID longo
  return false;
}

export async function zapiSendText(
  telefone: string,
  message: string,
): Promise<ZapiSendResult> {
  const phone = normalizarTelefone(telefone);
  const resp = await fetch(`${BASE_URL}/send-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": Z_API_CLIENT_TOKEN,
    },
    body: JSON.stringify({ phone, message }),
  });
  const raw = await resp.json().catch(() => null);
  return { ok: resp.ok, status: resp.status, messageId: raw?.messageId, raw };
}

export async function zapiSendSequence(
  telefone: string,
  messages: string[],
  delayMs = 1200,
): Promise<ZapiSendResult[]> {
  const out: ZapiSendResult[] = [];
  for (const m of messages) {
    out.push(await zapiSendText(telefone, m));
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  return out;
}
