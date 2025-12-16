import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheetLeadPayload {
  id?: string;
  created_time?: string;
  platform?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  form_id?: string;
  form_name?: string;
  full_name?: string;
  phone_number?: string;
  email?: string;
  origem?: 'meta' | 'google';
  // Additional fields from the sheet
  [key: string]: any;
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

    const payload: SheetLeadPayload = await req.json();
    
    console.log('Received lead payload:', JSON.stringify(payload, null, 2));

    // Validate required fields
    const leadId = payload.id;
    const fullName = payload.full_name || payload.nome || 'Lead sem nome';
    const phone = payload.phone_number || payload.telefone || '';
    
    if (!leadId) {
      console.error('Missing Lead ID');
      return new Response(
        JSON.stringify({ success: false, error: 'Lead ID é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if lead already exists by Lead ID
    const { data: existingLead } = await supabase
      .from('contact_submissions')
      .select('id, whatsapp_id')
      .eq('whatsapp_id', leadId)
      .maybeSingle();

    if (existingLead) {
      console.log('Lead already exists:', leadId);
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

    // Determine origin (meta or google)
    const origem = payload.origem || 'meta';

    // Extract Meta Ads specific data for JSONB storage
    const metaAdsData = {
      lead_id_original: leadId,
      platform: payload.platform,
      campaign_id: payload.campaign_id,
      campaign_name: payload.campaign_name,
      adset_id: payload.adset_id,
      adset_name: payload.adset_name,
      ad_id: payload.ad_id,
      ad_name: payload.ad_name,
      form_id: payload.form_id,
      form_name: payload.form_name,
      created_time_original: payload.created_time,
      raw_data: payload, // Store complete raw data
    };

    // Insert new lead
    const { data: newLead, error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        nome_completo: fullName,
        telefone: phone,
        email: payload.email || `lead-${leadId}@placeholder.com`,
        tipo_processo: payload.tipo_processo || 'A definir',
        como_conheceu: origem === 'meta' ? 'Meta Ads' : 'Google Ads',
        mensagem: `Lead capturado via ${origem === 'meta' ? 'Meta Ads' : 'Google Ads'}`,
        lgpd_consent: true,
        origem: origem,
        estagio: 'novo',
        prioridade: 'media',
        whatsapp_id: leadId,
        utm_source: payload.platform || origem,
        utm_campaign: payload.campaign_name,
        canal_especifico: payload.adset_name,
        conversa_bot_completa: metaAdsData,
        primeiro_contato_em: payload.created_time ? new Date(payload.created_time).toISOString() : new Date().toISOString(),
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
        descricao: `${fullName} - via ${origem === 'meta' ? 'Meta Ads' : 'Google Ads'} (${payload.campaign_name || 'Campanha não identificada'})`,
        link: `/dashboard/leads?id=${newLead.id}`,
        metadata: { leadId: newLead.id, origem },
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
        descricao: `Lead ${fullName} capturado via ${origem === 'meta' ? 'Meta Ads' : 'Google Ads'}`,
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
