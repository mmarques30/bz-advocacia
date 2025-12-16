import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheetLeadPayload {
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

// Generate a simple hash for unique ID
function generateLeadId(createdTime: string, phone: string): string {
  const str = `${createdTime}-${phone}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `meta-${Math.abs(hash).toString(36)}`;
}

// Clean phone number
function cleanPhone(phone: string | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

serve(async (req) => {
  // Handle CORS preflight
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
        console.error('Empty request body received');
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

    // Extract fields from the exact column names
    const fullName = payload.full_name || payload['full_name'] || 'Lead sem nome';
    const phone = cleanPhone(payload.phone_number || payload['phone_number'] || payload['Contato no WhatsApp']);
    const createdTime = payload.created_time || payload['created_time'] || new Date().toISOString();
    
    if (!phone) {
      console.error('Missing phone number');
      return new Response(
        JSON.stringify({ success: false, error: 'Telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique ID from created_time + phone
    const leadId = generateLeadId(createdTime, phone);
    console.log('Generated lead ID:', leadId);

    // Check if lead already exists by generated ID or phone in last 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: existingLead } = await supabase
      .from('contact_submissions')
      .select('id, whatsapp_id, telefone')
      .or(`whatsapp_id.eq.${leadId},and(telefone.eq.${phone},created_at.gte.${twentyFourHoursAgo})`)
      .maybeSingle();

    if (existingLead) {
      console.log('Lead already exists:', existingLead.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          duplicate: true, 
          message: 'Lead já existe no sistema',
          leadId: existingLead.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract form responses
    const tipoServico = payload['qual_tipo_de_serviço_você_procura?'] || 'A definir';
    const bemInventariar = payload['qual_bem_você_deseja_inventariar?_'] || '';
    const tipoContato = payload['qual_o_melhor_tipo_de_contato_para_você?'] || '';

    // Build Meta Ads data for JSONB storage
    const metaAdsData = {
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
        tipo_servico: tipoServico,
        bem_inventariar: bemInventariar,
        tipo_contato: tipoContato,
      },
      raw_data: payload,
    };

    // Build message from form responses
    let mensagem = `Lead capturado via Meta Ads`;
    if (bemInventariar) {
      mensagem += ` - Bem a inventariar: ${bemInventariar}`;
    }
    if (tipoContato) {
      mensagem += ` - Contato preferido: ${tipoContato}`;
    }

    // Insert new lead
    const { data: newLead, error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        nome_completo: fullName,
        telefone: phone,
        email: `lead-${leadId}@placeholder.com`,
        tipo_processo: tipoServico,
        como_conheceu: 'Meta Ads',
        mensagem: mensagem,
        lgpd_consent: true,
        origem: 'meta',
        estagio: 'novo',
        prioridade: 'media',
        whatsapp_id: leadId,
        utm_source: payload.platform || 'meta',
        utm_campaign: payload.campaign_name,
        canal_especifico: payload.adset_name,
        conversa_bot_completa: metaAdsData,
        primeiro_contato_em: createdTime ? new Date(createdTime).toISOString() : new Date().toISOString(),
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

    // Create notification for new lead
    const { error: notifError } = await supabase
      .from('notificacoes')
      .insert({
        tipo: 'novo_lead',
        titulo: 'Novo lead recebido',
        descricao: `${fullName} - via Meta Ads (${payload.campaign_name || 'Campanha não identificada'})`,
        link: `/dashboard/leads?id=${newLead.id}`,
        metadata: { leadId: newLead.id, origem: 'meta' },
      });

    if (notifError) {
      console.warn('Error creating notification:', notifError);
    }

    // Create activity log
    await supabase
      .from('atividades')
      .insert({
        tipo: 'lead_criado',
        entidade_tipo: 'lead',
        entidade_id: newLead.id,
        descricao: `Lead ${fullName} capturado via Meta Ads`,
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        duplicate: false,
        message: 'Lead criado com sucesso',
        leadId: newLead.id 
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
