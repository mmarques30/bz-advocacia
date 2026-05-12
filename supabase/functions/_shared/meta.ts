// Cliente Meta Graph API — usado para puxar dados do lead a partir do leadgen_id
// que o webhook do Lead Ads entrega.

const GRAPH_VERSION = "v19.0";

export interface MetaFieldData {
  name: string;
  values: string[];
}

export interface MetaLead {
  id: string;
  created_time: string;
  field_data: MetaFieldData[];
  page_id?: string;
  form_id?: string;
}

/**
 * Busca os dados de um lead a partir do leadgen_id, usando o Page Access Token.
 * Doc: https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving
 */
export async function buscarLeadDoMeta(
  leadgenId: string,
  pageAccessToken: string,
): Promise<MetaLead | null> {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${leadgenId}?access_token=${pageAccessToken}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    console.error("Meta Graph API erro:", resp.status, await resp.text());
    return null;
  }
  return (await resp.json()) as MetaLead;
}

/**
 * Mapeamento flexível de nomes de campo do Meta Form → schema do `leads`.
 * Aceita variações comuns em pt-BR e en-US.
 */
const SINONIMOS_NOME = ["full_name", "name", "nome", "nome_completo"];
const SINONIMOS_TELEFONE = ["phone_number", "phone", "telefone", "whatsapp", "celular", "numero_de_telefone"];
const SINONIMOS_TIPO_PROCESSO = [
  "tipo_de_processo",
  "tipo_processo",
  "area",
  "area_juridica",
  "qual_a_sua_demanda",
  "qual_o_tipo_de_caso",
  "tipo_de_caso",
  "qual_tipo_de_caso",
];
const SINONIMOS_EMAIL = ["email"];

function pegarCampo(fields: MetaFieldData[], sinonimos: string[]): string | null {
  for (const sin of sinonimos) {
    const found = fields.find(
      (f) => f.name.toLowerCase().replace(/[?!.,]/g, "").trim() === sin,
    );
    if (found && found.values[0]) return found.values[0];
  }
  return null;
}

export interface LeadNormalizado {
  nome: string;
  telefone: string;
  tipo_de_processo: string | null;
  email?: string | null;
  raw_meta: Record<string, string>;
}

/**
 * Converte um MetaLead em um objeto pronto pra inserir em public.leads.
 */
export function normalizarLeadDoMeta(meta: MetaLead): LeadNormalizado | null {
  const nome = pegarCampo(meta.field_data, SINONIMOS_NOME);
  const telefone = pegarCampo(meta.field_data, SINONIMOS_TELEFONE);
  const tipoProcesso = pegarCampo(meta.field_data, SINONIMOS_TIPO_PROCESSO);
  const email = pegarCampo(meta.field_data, SINONIMOS_EMAIL);

  if (!nome || !telefone) return null;

  // Salva todos os campos crus pra debug e enriquecer depois
  const raw: Record<string, string> = {};
  for (const f of meta.field_data) raw[f.name] = f.values.join(", ");

  return {
    nome,
    telefone,
    tipo_de_processo: tipoProcesso,
    email,
    raw_meta: raw,
  };
}

/**
 * Valida a assinatura X-Hub-Signature-256 enviada pelo Meta.
 * Doc: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#event-notifications
 */
export async function validarAssinaturaMeta(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;
  // Formato: "sha256=<hex>"
  const [algo, expectedHex] = signatureHeader.split("=");
  if (algo !== "sha256" || !expectedHex) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computed = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparação tempo-constante
  if (computed.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  return diff === 0;
}
