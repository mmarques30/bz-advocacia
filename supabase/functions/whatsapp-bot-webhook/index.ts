import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  nome_completo: string;
  telefone: string;
  email?: string;
  area_juridica?: string;
  descricao_caso?: string;
  origem?: string;
  canal_especifico?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  bot_finalizado?: boolean;
  perguntas_respondidas?: number;
  mensagens?: Array<{
    texto: string;
    de_bot: boolean;
    timestamp: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: WebhookPayload = await req.json();
    
    console.log('Webhook payload received:', { telefone: payload.telefone, nome: payload.nome_completo });

    // Validação dos campos obrigatórios
    if (!payload.nome_completo || !payload.telefone) {
      return new Response(
        JSON.stringify({ error: 'nome_completo e telefone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar lead existente pelo telefone
    const { data: existingLead, error: searchError } = await supabase
      .from('contact_submissions')
      .select('id')
      .eq('telefone', payload.telefone)
      .maybeSingle();

    if (searchError) {
      console.error('Error searching lead:', searchError);
      throw searchError;
    }

    let leadId: string;
    let isNewLead = false;

    const leadData = {
      nome_completo: payload.nome_completo,
      telefone: payload.telefone,
      email: payload.email || '',
      tipo_processo: payload.area_juridica || 'Não especificado',
      mensagem: payload.descricao_caso || 'Lead recebido via WhatsApp Bot',
      origem: payload.origem || 'whatsapp_bot',
      canal_especifico: payload.canal_especifico,
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      bot_finalizado: payload.bot_finalizado || false,
      perguntas_respondidas: payload.perguntas_respondidas || 0,
      conversa_bot_completa: payload.mensagens || [],
      ultimo_contato_em: new Date().toISOString(),
      como_conheceu: 'WhatsApp Bot',
      status: 'novo',
      lgpd_consent: true,
    };

    if (existingLead) {
      // Atualizar lead existente
      const { data: updatedLead, error: updateError } = await supabase
        .from('contact_submissions')
        .update(leadData)
        .eq('id', existingLead.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Error updating lead:', updateError);
        throw updateError;
      }

      leadId = updatedLead.id;
      console.log('Lead updated:', leadId);
    } else {
      // Criar novo lead
      isNewLead = true;
      const { data: newLead, error: insertError } = await supabase
        .from('contact_submissions')
        .insert({
          ...leadData,
          primeiro_contato_em: new Date().toISOString(),
          estagio: 'novo',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating lead:', insertError);
        throw insertError;
      }

      leadId = newLead.id;
      console.log('Lead created:', leadId);
    }

    // Registrar interações
    if (payload.mensagens && payload.mensagens.length > 0) {
      const interacoes = payload.mensagens.map(msg => ({
        lead_id: leadId,
        tipo: 'mensagem_bot',
        canal: 'whatsapp',
        mensagem: msg.texto,
        eh_bot: msg.de_bot,
        direcao: msg.de_bot ? 'saida' : 'entrada',
        created_at: msg.timestamp,
      }));

      const { error: interacoesError } = await supabase
        .from('lead_interacoes')
        .insert(interacoes);

      if (interacoesError) {
        console.error('Error saving interactions:', interacoesError);
        // Não falhar se houver erro nas interações
      } else {
        console.log(`${interacoes.length} interações registradas`);
      }
    }

    // Criar atividade
    await supabase.from('atividades').insert({
      tipo: isNewLead ? 'lead_criado' : 'lead_atualizado',
      descricao: `Lead ${isNewLead ? 'criado' : 'atualizado'} via WhatsApp Bot: ${payload.nome_completo}`,
      entidade_tipo: 'lead',
      entidade_id: leadId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: leadId,
        is_new_lead: isNewLead,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});