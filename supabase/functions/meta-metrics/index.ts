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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Usuário não encontrado');

    // Buscar conexão ativa
    const { data: connection } = await supabase
      .from('meta_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'ativa')
      .single();

    if (!connection) {
      throw new Error('Nenhuma conexão Meta ativa encontrada');
    }

    // TODO: Quando credenciais estiverem disponíveis, buscar métricas da API Meta
    const { dataInicio, dataFim } = await req.json();
    
    // Buscar insights da conta
    const insightsUrl = new URL(`https://graph.facebook.com/v18.0/${connection.account_id}/insights`);
    insightsUrl.searchParams.set('access_token', connection.access_token);
    insightsUrl.searchParams.set('fields', 'spend,impressions,reach,clicks,ctr,cpc,actions,cost_per_action_type');
    insightsUrl.searchParams.set('time_range', JSON.stringify({
      since: dataInicio,
      until: dataFim
    }));
    insightsUrl.searchParams.set('level', 'account');

    const response = await fetch(insightsUrl.toString());
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Processar e salvar métricas no cache
    const insights = data.data[0];
    const leads = insights.actions?.find((a: any) => a.action_type === 'lead')?.value || 0;
    const custoLead = insights.cost_per_action_type?.find((c: any) => c.action_type === 'lead')?.value || 0;

    const { error: metricsError } = await supabase
      .from('meta_metricas')
      .upsert({
        connection_id: connection.id,
        data_referencia: dataFim,
        gasto: parseFloat(insights.spend || 0),
        impressoes: parseInt(insights.impressions || 0),
        alcance: parseInt(insights.reach || 0),
        cliques: parseInt(insights.clicks || 0),
        ctr: parseFloat(insights.ctr || 0),
        cpc: parseFloat(insights.cpc || 0),
        leads: parseInt(leads),
        custo_lead: parseFloat(custoLead),
      }, {
        onConflict: 'connection_id,data_referencia'
      });

    if (metricsError) throw metricsError;

    // Atualizar última sincronização
    await supabase
      .from('meta_connections')
      .update({ ultima_sincronizacao: new Date().toISOString() })
      .eq('id', connection.id);

    return new Response(
      JSON.stringify({ success: true, data: insights }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in meta-metrics:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
