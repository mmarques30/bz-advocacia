import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Clean phone number - UNIQUE KEY
function cleanPhone(phone: string | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

// Map platform value to normalized origin
function mapPlatformToOrigem(platform: string | undefined, isOrganic: string | undefined): string {
  const p = (platform || '').toLowerCase().trim();
  if (p === 'fb' || p === 'facebook') return 'facebook';
  if (p === 'ig' || p === 'instagram') return 'instagram';
  if (p === 'tiktok') return 'tiktok';
  if (p === 'linkedin') return 'linkedin';
  if (p === 'google') return 'google';
  if (isOrganic === 'true') return 'outro';
  if (p) return 'meta';
  return 'meta';
}

// Parse Brazilian date format (DD/MM/YYYY HH:MM:SS or DD/MM/YYYY)
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
  } catch (e) {
    console.warn('Failed to parse date:', dateStr, e);
  }
  return new Date().toISOString();
}

// Detect if payload is from Google Sheets (Portuguese columns)
function isGoogleSheetsPayload(payload: any): boolean {
  return 'Nome' in payload || 'Telefone' in payload || 'Serviço' in payload || 'Data da entrada' in payload;
}

// Extract normalized fields from any payload format
function extractFields(payload: any) {
  const isSheets = isGoogleSheetsPayload(payload);
  
  if (isSheets) {
    const phone = cleanPhone(payload['Telefone'] || payload['WhatsApp']);
    const platform = payload['platform'] || '';
    const isOrganic = payload['is_organic'] || '';
    return {
      fullName: payload['Nome'] || 'Lead sem nome',
      phone,
      createdTime: parseBrazilianDate(payload['Data da entrada']),
      tipoServico: payload['Serviço'] || 'A definir',
      origem: mapPlatformToOrigem(platform, isOrganic),
      ingestionChannel: 'google_sheets',
      // Marketing fields (may come from sheets that have Meta columns too)
      sourcePlatform: platform || null,
      isOrganic: isOrganic === 'true',
      campaignId: payload['campaign_id'] || null,
      campaignName: payload['campaign_name'] || null,
      adsetId: payload['adset_id'] || null,
      adsetName: payload['adset_name'] || null,
      adId: payload['ad_id'] || null,
      adName: payload['ad_name'] || null,
      formId: payload['form_id'] || null,
      formName: payload['form_name'] || null,
      mensagem: buildMessage(payload, isSheets),
    };
  } else {
    const phone = cleanPhone(payload.phone_number || payload['Contato no WhatsApp']);
    return {
      fullName: payload.full_name || 'Lead sem nome',
      phone,
      createdTime: payload.created_time || new Date().toISOString(),
      tipoServico: payload['qual_tipo_de_serviço_você_procura?'] || 'A definir',
      origem: mapPlatformToOrigem(payload.platform, payload.is_organic),
      ingestionChannel: 'n8n',
      sourcePlatform: payload.platform || null,
      isOrganic: payload.is_organic === 'true',
      campaignId: payload.campaign_id || null,
      campaignName: payload.campaign_name || null,
      adsetId: payload.adset_id || null,
      adsetName: payload.adset_name || null,
      adId: payload.ad_id || null,
      adName: payload.ad_name || null,
      formId: payload.form_id || null,
      formName: payload.form_name || null,
      mensagem: buildMessage(payload, false),
    };
  }
}

function buildMessage(payload: any, isSheets: boolean): string {
  if (isSheets) {
    let msg = 'Lead capturado via campanha';
    const inv = payload['Tipo de inventário'] || '';
    const atend = payload['Tipo de atendimento'] || '';
    if (inv) msg += ` - Tipo de inventário: ${inv}`;
    if (atend) msg += ` - Tipo de atendimento: ${atend}`;
    return msg;
  } else {
    let msg = 'Lead capturado via Meta Ads';
    const bem = payload['qual_bem_você_deseja_inventariar?_'] || '';
    const contato = payload['qual_o_melhor_tipo_de_contato_para_você?'] || '';
    if (bem) msg += ` - Bem a inventariar: ${bem}`;
    if (contato) msg += ` - Contato preferido: ${contato}`;
    return msg;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let payload: any;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      if (!text || text.trim() === '') {
        return new Response(
          JSON.stringify({ success: false, error: 'Request body is empty' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      payload = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received lead payload:', JSON.stringify(payload, null, 2));

    const fields = extractFields(payload);

    if (!fields.phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== 1. ALWAYS insert acquisition event (marketing table) =====
    const { error: eventError } = await supabase
      .from('lead_acquisition_events')
      .insert({
        phone_normalized: fields.phone,
        occurred_at: fields.createdTime,
        source_platform: fields.sourcePlatform,
        is_organic: fields.isOrganic,
        origem_resolved: fields.origem,
        ingestion_channel: fields.ingestionChannel,
        campaign_id: fields.campaignId,
        campaign_name: fields.campaignName,
        adset_id: fields.adsetId,
        adset_name: fields.adsetName,
        ad_id: fields.adId,
        ad_name: fields.adName,
        form_id: fields.formId,
        form_name: fields.formName,
        raw_payload: payload,
      });

    if (eventError) {
      console.error('Error inserting acquisition event:', eventError);
    }

    // ===== 2. UPSERT CRM (contact_submissions) =====
    const { data: existingLead } = await supabase
      .from('contact_submissions')
      .select('id')
      .eq('telefone', fields.phone)
      .maybeSingle();

    if (existingLead) {
      // Only update technical fields, NEVER CRM-editable fields
      const { error: updateError } = await supabase
        .from('contact_submissions')
        .update({ ultimo_contato_em: new Date().toISOString() })
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('Error updating existing lead:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Link event to CRM record
      await supabase
        .from('lead_acquisition_events')
        .update({ contact_submission_id: existingLead.id })
        .eq('phone_normalized', fields.phone)
        .is('contact_submission_id', null);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'existing_lead_event_recorded',
          message: 'Lead já existe — evento de aquisição registrado, CRM intocado',
          leadId: existingLead.id,
          phone: fields.phone,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== INSERT NEW LEAD =====
    const { data: newLead, error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        nome_completo: fields.fullName,
        telefone: fields.phone,
        email: '',
        tipo_processo: fields.tipoServico,
        como_conheceu: 'Meta Ads',
        mensagem: fields.mensagem,
        lgpd_consent: true,
        origem: fields.origem,
        estagio: 'novo',
        prioridade: 'media',
        utm_source: fields.sourcePlatform || 'meta',
        utm_campaign: fields.campaignName,
        canal_especifico: fields.adsetName,
        primeiro_contato_em: fields.createdTime,
        ultimo_contato_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting lead:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Link acquisition events to the new CRM record
    await supabase
      .from('lead_acquisition_events')
      .update({ contact_submission_id: newLead.id })
      .eq('phone_normalized', fields.phone)
      .is('contact_submission_id', null);

    console.log('Lead created successfully:', newLead.id);

    // Create notification
    const sourceLabel = `Meta Ads (${fields.campaignName || 'Campanha não identificada'})`;
    await supabase.from('notificacoes').insert({
      tipo: 'novo_lead',
      titulo: 'Novo lead recebido',
      descricao: `${fields.fullName} - via ${sourceLabel}`,
      link: `/dashboard/leads?id=${newLead.id}`,
      metadata: { leadId: newLead.id, origem: fields.origem },
    });

    await supabase.from('atividades').insert({
      tipo: 'lead_criado',
      entidade_tipo: 'lead',
      entidade_id: newLead.id,
      descricao: `Lead ${fields.fullName} capturado via ${sourceLabel}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        action: 'insert',
        message: 'Lead criado com sucesso',
        leadId: newLead.id,
        phone: fields.phone,
        origem: fields.origem,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing lead:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
