import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Original Meta Ads format
interface MetaAdsPayload {
  created_time?: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  form_name?: string;
  is_organic?: string;
  platform?: string;
  'qual_tipo_de_serviço_você_procura?'?: string;
  'qual_bem_você_deseja_inventariar?_'?: string;
  'qual_o_melhor_tipo_de_contato_para_você?'?: string;
  full_name?: string;
  phone_number?: string;
  'Contato no WhatsApp'?: string;
  [key: string]: any;
}

// Google Sheets format (Portuguese columns)
interface GoogleSheetsPayload {
  'Data da entrada'?: string;
  'Nome'?: string;
  'Serviço'?: string;
  'Tipo de inventário'?: string;
  'Tipo de atendimento'?: string;
  'Telefone'?: string;
  'WhatsApp'?: string;
  [key: string]: any;
}

type SheetLeadPayload = MetaAdsPayload | GoogleSheetsPayload;

// Detect if payload is from Google Sheets (Portuguese columns)
function isGoogleSheetsPayload(payload: any): payload is GoogleSheetsPayload {
  return 'Nome' in payload || 'Telefone' in payload || 'Serviço' in payload || 'Data da entrada' in payload;
}

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
  // Default to 'meta' for any Meta Ads platform
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
      
      const date = new Date(year, month, day, hours, minutes, seconds);
      return date.toISOString();
    }
  } catch (e) {
    console.warn('Failed to parse date:', dateStr, e);
  }
  
  return new Date().toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let payload: SheetLeadPayload;
    
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

    let fullName: string;
    let phone: string;
    let createdTime: string;
    let tipoServico: string;
    let origem: string;
    let mensagem: string;
    let metaAdsData: Record<string, any>;
    let utmSource: string;
    let utmCampaign: string | undefined;
    let canalEspecifico: string | undefined;

    if (isGoogleSheetsPayload(payload)) {
      console.log('Detected Google Sheets payload format');
      
      fullName = payload['Nome'] || 'Lead sem nome';
      phone = cleanPhone(payload['Telefone'] || payload['WhatsApp']);
      createdTime = parseBrazilianDate(payload['Data da entrada']);
      tipoServico = payload['Serviço'] || 'A definir';
      // Derive origin from actual source, not ingestion channel
      origem = 'meta'; // Default for Google Sheets imports (mostly Meta Ads)
      utmSource = 'google_sheets';
      
      const tipoInventario = payload['Tipo de inventário'] || '';
      const tipoAtendimento = payload['Tipo de atendimento'] || '';
      
      mensagem = `Lead capturado via campanha`;
      if (tipoInventario) mensagem += ` - Tipo de inventário: ${tipoInventario}`;
      if (tipoAtendimento) mensagem += ` - Tipo de atendimento: ${tipoAtendimento}`;
      
      metaAdsData = {
        source: 'google_sheets_import',
        imported_at: new Date().toISOString(),
        original_date: payload['Data da entrada'],
        respostas_formulario: {
          tipo_servico: tipoServico,
          tipo_inventario: tipoInventario,
          tipo_atendimento: tipoAtendimento,
        },
        raw_data: payload,
      };
      
    } else {
      console.log('Detected Meta Ads payload format');
      
      fullName = payload.full_name || payload['full_name'] || 'Lead sem nome';
      phone = cleanPhone(payload.phone_number || payload['phone_number'] || payload['Contato no WhatsApp']);
      createdTime = payload.created_time || payload['created_time'] || new Date().toISOString();
      
      const tipoServicoMeta = payload['qual_tipo_de_serviço_você_procura?'] || 'A definir';
      tipoServico = tipoServicoMeta;
      origem = mapPlatformToOrigem(payload.platform, payload.is_organic);
      utmSource = payload.platform || 'meta';
      utmCampaign = payload.campaign_name;
      canalEspecifico = payload.adset_name;
      
      const bemInventariar = payload['qual_bem_você_deseja_inventariar?_'] || '';
      const tipoContato = payload['qual_o_melhor_tipo_de_contato_para_você?'] || '';

      mensagem = `Lead capturado via Meta Ads`;
      if (bemInventariar) mensagem += ` - Bem a inventariar: ${bemInventariar}`;
      if (tipoContato) mensagem += ` - Contato preferido: ${tipoContato}`;
      
      metaAdsData = {
        source: 'meta_ads',
        created_time_original: createdTime,
        ad_id: payload.ad_id,
        ad_name: payload.ad_name,
        adset_id: payload.adset_id,
        adset_name: payload.adset_name,
        campaign_id: payload.campaign_id,
        campaign_name: payload.campaign_name,
        form_id: payload.form_id,
        form_name: payload.form_name,
        is_organic: payload.is_organic,
        platform: payload.platform,
        respostas_formulario: {
          tipo_servico: tipoServicoMeta,
          bem_inventariar: bemInventariar,
          tipo_contato: tipoContato,
        },
        raw_data: payload,
      };
    }
    
    if (!phone) {
      console.error('Missing phone number');
      return new Response(
        JSON.stringify({ success: false, error: 'Telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== UPSERT BY NORMALIZED PHONE =====
    // Check if lead already exists by phone (permanent unique key)
    const { data: existingLead } = await supabase
      .from('contact_submissions')
      .select('id, telefone, conversa_bot_completa')
      .eq('telefone', phone)
      .maybeSingle();

    if (existingLead) {
      // PARTIAL UPDATE: only technical/metadata fields, NEVER overwrite dashboard-editable fields
      console.log('Lead already exists (phone match):', existingLead.id, '- partial update only');

      // Append new import event to metadata history
      const existingMeta = (existingLead.conversa_bot_completa as Record<string, any>) || {};
      const importHistory = Array.isArray(existingMeta.import_history) ? existingMeta.import_history : [];
      importHistory.push({
        ...metaAdsData,
        seen_at: new Date().toISOString(),
      });

      const { error: updateError } = await supabase
        .from('contact_submissions')
        .update({
          ultimo_contato_em: new Date().toISOString(),
          conversa_bot_completa: {
            ...existingMeta,
            last_seen_at: new Date().toISOString(),
            last_source: origem,
            import_history: importHistory,
          },
        })
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('Error updating existing lead:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'partial_update',
          message: 'Lead já existe — apenas campos técnicos atualizados (ultimo_contato_em, metadata)',
          leadId: existingLead.id,
          unique_key: 'telefone',
          phone: phone,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== INSERT NEW LEAD =====
    const { data: newLead, error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        nome_completo: fullName,
        telefone: phone,
        email: '',
        tipo_processo: tipoServico,
        como_conheceu: origem === 'google_sheets' ? 'Google Sheets' : 'Meta Ads',
        mensagem: mensagem,
        lgpd_consent: true,
        origem: origem,
        estagio: 'novo',
        prioridade: 'media',
        utm_source: utmSource,
        utm_campaign: utmCampaign,
        canal_especifico: canalEspecifico,
        conversa_bot_completa: {
          ...metaAdsData,
          import_history: [{ ...metaAdsData, seen_at: new Date().toISOString() }],
        },
        primeiro_contato_em: createdTime,
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

    console.log('Lead created successfully:', newLead.id);

    // Create notification
    const sourceLabel = origem === 'google_sheets' ? 'Google Sheets' : `Meta Ads (${utmCampaign || 'Campanha não identificada'})`;
    await supabase
      .from('notificacoes')
      .insert({
        tipo: 'novo_lead',
        titulo: 'Novo lead recebido',
        descricao: `${fullName} - via ${sourceLabel}`,
        link: `/dashboard/leads?id=${newLead.id}`,
        metadata: { leadId: newLead.id, origem: origem },
      });

    // Create activity log
    await supabase
      .from('atividades')
      .insert({
        tipo: 'lead_criado',
        entidade_tipo: 'lead',
        entidade_id: newLead.id,
        descricao: `Lead ${fullName} capturado via ${sourceLabel}`,
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: 'insert',
        message: 'Lead criado com sucesso',
        leadId: newLead.id,
        unique_key: 'telefone',
        phone: phone,
        origem: origem,
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
