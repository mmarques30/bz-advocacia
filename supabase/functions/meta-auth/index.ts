import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // TODO: Quando credenciais estiverem disponíveis, implementar OAuth flow
    const META_APP_ID = Deno.env.get('META_APP_ID');
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';
    
    if (!META_APP_ID) {
      return new Response(
        JSON.stringify({ 
          error: 'Meta App ID não configurado. Configure as credenciais da API Meta.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Gerar URL de autorização OAuth
    const state = crypto.randomUUID();
    const redirectUri = `${APP_URL}/api/meta/callback`;
    
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', META_APP_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'ads_read,ads_management,business_management');
    authUrl.searchParams.set('response_type', 'code');

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        state 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in meta-auth:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
