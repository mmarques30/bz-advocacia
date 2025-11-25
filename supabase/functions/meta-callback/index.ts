import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, state } = await req.json();
    
    if (!code) {
      throw new Error('Authorization code não fornecido');
    }

    // TODO: Quando credenciais estiverem disponíveis, implementar troca de código por token
    const META_APP_ID = Deno.env.get('META_APP_ID');
    const META_APP_SECRET = Deno.env.get('META_APP_SECRET');
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';
    
    if (!META_APP_ID || !META_APP_SECRET) {
      throw new Error('Credenciais Meta não configuradas');
    }

    // Trocar código por access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', META_APP_ID);
    tokenUrl.searchParams.set('client_secret', META_APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri', `${APP_URL}/api/meta/callback`);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Falha ao obter access token');
    }

    // Buscar contas de anúncios
    const accountsUrl = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,currency,account_status&access_token=${tokenData.access_token}`;
    const accountsResponse = await fetch(accountsUrl);
    const accountsData = await accountsResponse.json();

    // Salvar conexão no banco
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Usuário não encontrado');

    // Calcular data de expiração (60 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    const { data: connection, error: connectionError } = await supabase
      .from('meta_connections')
      .insert({
        user_id: user.id,
        access_token: tokenData.access_token,
        token_expires_at: expiresAt.toISOString(),
        account_id: accountsData.data[0].id,
        account_name: accountsData.data[0].name,
        status: 'ativa',
      })
      .select()
      .single();

    if (connectionError) throw connectionError;

    return new Response(
      JSON.stringify({ 
        success: true,
        connection,
        accounts: accountsData.data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in meta-callback:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
