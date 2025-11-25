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

    // TODO: Quando credenciais estiverem disponíveis, buscar campanhas da API Meta
    const campaignsUrl = new URL(`https://graph.facebook.com/v18.0/${connection.account_id}/campaigns`);
    campaignsUrl.searchParams.set('access_token', connection.access_token);
    campaignsUrl.searchParams.set('fields', 'id,name,status,objective,insights{spend,impressions,clicks,ctr,actions,cost_per_action_type}');
    campaignsUrl.searchParams.set('filtering', JSON.stringify([{
      field: 'effective_status',
      operator: 'IN',
      value: ['ACTIVE', 'PAUSED']
    }]));

    const response = await fetch(campaignsUrl.toString());
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Processar e salvar campanhas no cache
    for (const campaign of data.data) {
      const insights = campaign.insights?.data[0];
      if (!insights) continue;

      const leads = insights.actions?.find((a: any) => a.action_type === 'lead')?.value || 0;
      const custoLead = insights.cost_per_action_type?.find((c: any) => c.action_type === 'lead')?.value || 0;

      await supabase
        .from('meta_campanhas')
        .upsert({
          connection_id: connection.id,
          campaign_id: campaign.id,
          nome: campaign.name,
          status: campaign.status,
          objetivo: campaign.objective,
          gasto: parseFloat(insights.spend || 0),
          impressoes: parseInt(insights.impressions || 0),
          cliques: parseInt(insights.clicks || 0),
          leads: parseInt(leads),
          custo_lead: parseFloat(custoLead),
          ctr: parseFloat(insights.ctr || 0),
        }, {
          onConflict: 'connection_id,campaign_id'
        });
    }

    return new Response(
      JSON.stringify({ success: true, campaigns: data.data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in meta-campaigns:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
