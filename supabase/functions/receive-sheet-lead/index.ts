import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { verifyHmac } from "../_shared/verifyHmac.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-hub-signature-256, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Helpers ──────────────────────────────────────────────

function cleanPhone(phone: string | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/** Resolve a origem REAL a partir do campo platform — nunca "meta" genérico */
function resolveOrigem(platform: string | undefined, isOrganic: boolean): string {
  const p = (platform || '').toLowerCase().trim();
  if (p === 'fb' || p === 'facebook') return 'facebook';
  if (p === 'ig' || p === 'instagram') return 'instagram';
  if (p === 'wa' || p === 'whatsapp') return 'whatsapp';
  if (p === 'google') return 'google';
  if (p === 'tiktok') return 'tiktok';
  if (p === 'linkedin') return 'linkedin';
  if (isOrganic) return 'organico';
  if (p) return p; // preservar valor original se não mapeado
  return 'desconhecido';
}

function parseBrazilianDate(dateStr: string | undefined): string {
  if (!dateStr) return new Date().toISOString();
  try {
    if (dateStr.includes('T') || dateStr.includes('-')) {
      return new Date(dateStr).toISOString();
    }
    const parts = dateStr.split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);
      let hours = 0, minutes = 0, seconds = 0;
      if (parts[1]) {
        const timeParts = parts[1].split(':');
        hours = parseInt(timeParts[0] || '0', 10);
        minutes = parseInt(timeParts[1] || '0', 10);
        seconds = parseInt(timeParts[2] || '0', 10);
      }
      return new Date(year, month, day, hours, minutes, seconds).toISOString();
    }
  } catch (_e) { /* fall through */ }
  return new Date().toISOString();
}

/** Hash determinístico para detectar alterações na linha da planilha */
async function computeHash(payload: Record<string, unknown>): Promise<string> {
  const ordered = JSON.stringify(payload, Object.keys(payload).sort());
  const encoded = new TextEncoder().encode(ordered);
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Detecção de formato (Sheets PT-BR vs n8n EN) ────────

function isGoogleSheetsPayload(payload: Record<string, unknown>): boolean {
  return 'Nome' in payload || 'Telefone' in payload || 'Serviço' in payload || 'Data da entrada' in payload;
}

interface NormalizedRow {
  id: string;
  fullName: string;
  phone: string;
  phoneRaw: string;
  createdTime: string;
  platform: string;
  isOrganic: boolean;
  tipoServico: string;
  bemInventariar: string;
  preferenciaContato: string;
  contatoWhatsapp: string;
  campaignId: string;
  campaignName: string;
  adsetId: string;
  adsetName: string;
  adId: string;
  adName: string;
  formId: string;
  formName: string;
  leadStatus: string;
  isQualified: boolean;
  isQuality: boolean;
  isConverted: boolean;
  observacoes: string;
  origem: string;
  ingestionChannel: string;
  mensagem: string;
}

function extractFields(payload: Record<string, unknown>): NormalizedRow {
  const isSheets = isGoogleSheetsPayload(payload);

  const rawPlatform = String(payload['platform'] || payload['Platform'] || '');
  const rawIsOrganic = isSheets
    ? String(payload['is_organic'] || '') === 'true'
    : String(payload['is_organic'] || '') === 'true';

  const phone = isSheets
    ? cleanPhone(String(payload['Telefone'] || payload['WhatsApp'] || ''))
    : cleanPhone(String(payload['phone_number'] || payload['Contato no WhatsApp'] || ''));

  const phoneRaw = isSheets
    ? String(payload['Telefone'] || payload['WhatsApp'] || '')
    : String(payload['phone_number'] || payload['Contato no WhatsApp'] || '');

  const fullName = isSheets
    ? String(payload['Nome'] || 'Lead sem nome')
    : String(payload['full_name'] || 'Lead sem nome');

  const createdTime = isSheets
    ? parseBrazilianDate(String(payload['Data da entrada'] || ''))
    : String(payload['created_time'] || new Date().toISOString());

  const tipoServico = isSheets
    ? String(payload['Serviço'] || 'A definir')
    : String(payload['qual_tipo_de_serviço_você_procura?'] || payload['tipo_servico'] || 'A definir');

  const bemInventariar = String(payload['qual_bem_você_deseja_inventariar?_'] || payload['bem_inventariar'] || '');
  const preferenciaContato = String(payload['qual_o_melhor_tipo_de_contato_para_você?'] || payload['preferencia_contato'] || '');
  const contatoWhatsapp = String(payload['contato_whatsapp'] || payload['Contato no WhatsApp'] || '');

  // Build message
  let mensagem = isSheets ? 'Lead capturado via campanha' : 'Lead capturado via Meta Ads';
  const inv = String(payload['Tipo de inventário'] || '');
  const atend = String(payload['Tipo de atendimento'] || '');
  if (inv) mensagem += ` - Tipo de inventário: ${inv}`;
  if (atend) mensagem += ` - Tipo de atendimento: ${atend}`;
  if (bemInventariar) mensagem += ` - Bem a inventariar: ${bemInventariar}`;
  if (preferenciaContato) mensagem += ` - Contato preferido: ${preferenciaContato}`;

  return {
    id: String(payload['id'] || payload['Id'] || ''),
    fullName,
    phone,
    phoneRaw,
    createdTime,
    platform: rawPlatform,
    isOrganic: rawIsOrganic,
    tipoServico,
    bemInventariar,
    preferenciaContato,
    contatoWhatsapp,
    campaignId: String(payload['campaign_id'] || ''),
    campaignName: String(payload['campaign_name'] || ''),
    adsetId: String(payload['adset_id'] || ''),
    adsetName: String(payload['adset_name'] || ''),
    adId: String(payload['ad_id'] || ''),
    adName: String(payload['ad_name'] || ''),
    formId: String(payload['form_id'] || ''),
    formName: String(payload['form_name'] || ''),
    leadStatus: String(payload['lead_status'] || ''),
    isQualified: payload['is_qualified'] === true || payload['is_qualified'] === 'true',
    isQuality: payload['is_quality'] === true || payload['is_quality'] === 'true',
    isConverted: payload['is_converted'] === true || payload['is_converted'] === 'true',
    observacoes: String(payload['observacoes'] || ''),
    origem: resolveOrigem(rawPlatform, rawIsOrganic),
    ingestionChannel: isSheets ? 'google_sheets' : 'n8n',
    mensagem,
  };
}

// ── Main handler ────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse body
    const text = await req.text();
    if (!text || text.trim() === '') {
      return new Response(JSON.stringify({ success: false, error: 'Request body is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // HMAC verification (graceful rollout: enforced only when secret is set)
    const hmac = await verifyHmac(req, text, 'SHEET_WEBHOOK_SECRET');
    if (!hmac.ok) {
      console.warn('HMAC verification failed:', hmac.reason);
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized: ' + hmac.reason }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(text);
    } catch (_e) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Received payload:', JSON.stringify(payload, null, 2));

    const f = extractFields(payload);

    if (!f.phone) {
      return new Response(JSON.stringify({ success: false, error: 'Telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const sourceHash = await computeHash(payload);

    // ═══════════════════════════════════════════════════════
    // STEP 1 — INSERT no sheet_leads_raw (espelho imutável)
    // ═══════════════════════════════════════════════════════
    const rawId = f.id || `auto_${f.phone}_${Date.now()}`;

    const { error: rawError } = await supabase
      .from('sheet_leads_raw')
      .upsert({
        id: rawId,
        full_name: f.fullName,
        phone_number: f.phoneRaw,
        created_time: f.createdTime,
        platform: f.platform || null,
        is_organic: f.isOrganic,
        tipo_servico: f.tipoServico,
        bem_inventariar: f.bemInventariar || null,
        preferencia_contato: f.preferenciaContato || null,
        contato_whatsapp: f.contatoWhatsapp || null,
        campaign_id: f.campaignId || null,
        campaign_name: f.campaignName || null,
        adset_id: f.adsetId || null,
        adset_name: f.adsetName || null,
        ad_id: f.adId || null,
        ad_name: f.adName || null,
        form_id: f.formId || null,
        form_name: f.formName || null,
        lead_status: f.leadStatus || null,
        is_qualified: f.isQualified,
        is_quality: f.isQuality,
        is_converted: f.isConverted,
        observacoes: f.observacoes || null,
        raw_json: payload,
        source_hash: sourceHash,
      }, { onConflict: 'id', ignoreDuplicates: true });

    if (rawError) {
      console.error('Error inserting RAW:', rawError);
      // Non-blocking — continue with CRM derivation even if RAW insert fails
      // (could be a duplicate with same id, which is fine)
    }

    // ═══════════════════════════════════════════════════════
    // STEP 2 — INSERT em lead_acquisition_events (marketing)
    // ═══════════════════════════════════════════════════════
    const { error: eventError } = await supabase
      .from('lead_acquisition_events')
      .insert({
        phone_normalized: f.phone,
        occurred_at: f.createdTime,
        source_platform: f.platform || null,
        is_organic: f.isOrganic,
        origem_resolved: f.origem,
        ingestion_channel: f.ingestionChannel,
        campaign_id: f.campaignId || null,
        campaign_name: f.campaignName || null,
        adset_id: f.adsetId || null,
        adset_name: f.adsetName || null,
        ad_id: f.adId || null,
        ad_name: f.adName || null,
        form_id: f.formId || null,
        form_name: f.formName || null,
        raw_payload: payload,
      });

    if (eventError) console.error('Error inserting acquisition event:', eventError);

    // ═══════════════════════════════════════════════════════
    // STEP 3 — UPSERT no CRM (contact_submissions)
    // ═══════════════════════════════════════════════════════
    const { data: existingLead } = await supabase
      .from('contact_submissions')
      .select('id')
      .eq('telefone', f.phone)
      .maybeSingle();

    if (existingLead) {
      // Lead já existe — NÃO sobrescrever campos editáveis
      await supabase
        .from('contact_submissions')
        .update({ ultimo_contato_em: new Date().toISOString() })
        .eq('id', existingLead.id);

      // Link events
      await supabase
        .from('lead_acquisition_events')
        .update({ contact_submission_id: existingLead.id })
        .eq('phone_normalized', f.phone)
        .is('contact_submission_id', null);

      return new Response(JSON.stringify({
        success: true,
        action: 'existing_lead_event_recorded',
        message: 'Lead já existe — evento de aquisição registrado, CRM intocado',
        leadId: existingLead.id,
        phone: f.phone,
        origem: f.origem,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Novo lead ────────────────────────────────────────
    const { data: newLead, error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        nome_completo: f.fullName,
        telefone: f.phone,
        email: '',
        tipo_processo: f.tipoServico,
        como_conheceu: 'Meta Ads',
        mensagem: f.mensagem,
        lgpd_consent: true,
        origem: f.origem,
        estagio: 'novo',
        prioridade: 'media',
        utm_source: f.platform || null,
        utm_campaign: f.campaignName || null,
        canal_especifico: f.adsetName || null,
        primeiro_contato_em: f.createdTime,
        ultimo_contato_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting lead:', insertError);
      return new Response(JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Link events
    await supabase
      .from('lead_acquisition_events')
      .update({ contact_submission_id: newLead.id })
      .eq('phone_normalized', f.phone)
      .is('contact_submission_id', null);

    // Notificação + Atividade
    const sourceLabel = `${f.origem} (${f.campaignName || 'Campanha não identificada'})`;

    await supabase.from('notificacoes').insert({
      tipo: 'novo_lead',
      titulo: 'Novo lead recebido',
      descricao: `${f.fullName} - via ${sourceLabel}`,
      link: `/dashboard/leads?id=${newLead.id}`,
      metadata: { leadId: newLead.id, origem: f.origem },
    });

    await supabase.from('atividades').insert({
      tipo: 'lead_criado',
      entidade_tipo: 'lead',
      entidade_id: newLead.id,
      descricao: `Lead ${f.fullName} capturado via ${sourceLabel}`,
    });

    console.log('Lead created:', newLead.id, 'origem:', f.origem);

    return new Response(JSON.stringify({
      success: true,
      action: 'insert',
      message: 'Lead criado com sucesso',
      leadId: newLead.id,
      phone: f.phone,
      origem: f.origem,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing lead:', error);
    return new Response(JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
