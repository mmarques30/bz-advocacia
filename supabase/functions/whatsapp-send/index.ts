import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface EnviarMensagemParams {
  destinatario_telefone: string;
  destinatario_nome?: string;
  mensagem: string;
  processo_id?: string;
  cliente_id?: string;
  template_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const params: EnviarMensagemParams = await req.json();

    // Buscar configuração WhatsApp
    const { data: config, error: configError } = await supabaseClient
      .from('whatsapp_config')
      .select('*')
      .eq('active', true)
      .single();

    if (configError || !config) {
      throw new Error('Configuração WhatsApp não encontrada ou inativa');
    }

    // Preparar envio baseado no provider
    let resultado;
    switch (config.provider) {
      case 'meta':
        resultado = await enviarViaMeta(config, params);
        break;
      case 'twilio':
        resultado = await enviarViaTwilio(config, params);
        break;
      case 'zenvia':
        resultado = await enviarViaZenvia(config, params);
        break;
      default:
        throw new Error(`Provider não suportado: ${config.provider}`);
    }

    // Registrar no histórico
    const { error: historicoError } = await supabaseClient
      .from('whatsapp_historico')
      .insert({
        template_id: params.template_id,
        processo_id: params.processo_id,
        cliente_id: params.cliente_id,
        destinatario_nome: params.destinatario_nome,
        destinatario_telefone: params.destinatario_telefone,
        mensagem: params.mensagem,
        status: resultado.sucesso ? 'enviado' : 'falhou',
        provider: config.provider,
        message_id_externo: resultado.messageId,
        erro_mensagem: resultado.erro,
        enviado_em: resultado.sucesso ? new Date().toISOString() : null,
      });

    if (historicoError) {
      console.error('Erro ao registrar histórico:', historicoError);
    }

    return new Response(
      JSON.stringify({
        sucesso: resultado.sucesso,
        messageId: resultado.messageId,
        erro: resultado.erro,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: resultado.sucesso ? 200 : 400,
      }
    );
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ erro: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Enviar via Meta Cloud API
async function enviarViaMeta(config: any, params: EnviarMensagemParams) {
  const phoneNumberId = config.credentials.phone_number_id || config.phone_number_id;
  const accessToken = config.credentials.access_token;

  if (!phoneNumberId || !accessToken) {
    throw new Error('Credenciais Meta incompletas');
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: params.destinatario_telefone.replace(/\D/g, ''),
          type: 'text',
          text: { body: params.mensagem },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        sucesso: false,
        erro: data.error?.message || 'Erro ao enviar via Meta',
      };
    }

    return {
      sucesso: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Enviar via Twilio
async function enviarViaTwilio(config: any, params: EnviarMensagemParams) {
  const accountSid = config.credentials.account_sid;
  const authToken = config.credentials.auth_token;

  if (!accountSid || !authToken) {
    throw new Error('Credenciais Twilio incompletas');
  }

  try {
    const auth = btoa(`${accountSid}:${authToken}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${config.phone_number}`,
          To: `whatsapp:${params.destinatario_telefone}`,
          Body: params.mensagem,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        sucesso: false,
        erro: data.message || 'Erro ao enviar via Twilio',
      };
    }

    return {
      sucesso: true,
      messageId: data.sid,
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Enviar via Zenvia
async function enviarViaZenvia(config: any, params: EnviarMensagemParams) {
  const apiKey = config.credentials.api_key;

  if (!apiKey) {
    throw new Error('Credenciais Zenvia incompletas');
  }

  try {
    const response = await fetch(
      'https://api.zenvia.com/v2/channels/whatsapp/messages',
      {
        method: 'POST',
        headers: {
          'X-API-TOKEN': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.phone_number,
          to: params.destinatario_telefone,
          contents: [{ type: 'text', text: params.mensagem }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        sucesso: false,
        erro: data.message || 'Erro ao enviar via Zenvia',
      };
    }

    return {
      sucesso: true,
      messageId: data.id,
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
