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

    const { dataInicio, dataFim, formato, email } = await req.json();

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

    // Buscar métricas do período
    const { data: metricas } = await supabase
      .from('meta_metricas')
      .select('*')
      .eq('connection_id', connection.id)
      .gte('data_referencia', dataInicio)
      .lte('data_referencia', dataFim);

    // Buscar campanhas
    const { data: campanhas } = await supabase
      .from('meta_campanhas')
      .select('*')
      .eq('connection_id', connection.id);

    // TODO: Quando RESEND_API_KEY estiver disponível, gerar PDF e enviar email
    const reportData = {
      periodo: { inicio: dataInicio, fim: dataFim },
      metricas: metricas || [],
      campanhas: campanhas || [],
      resumo: {
        investimentoTotal: metricas?.reduce((acc, m) => acc + (m.gasto || 0), 0) || 0,
        leadsGerados: metricas?.reduce((acc, m) => acc + (m.leads || 0), 0) || 0,
      }
    };

    // Se email fornecido, enviar relatório
    if (email) {
      // TODO: Implementar envio via Resend quando API key estiver disponível
      console.log('Email seria enviado para:', email);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Relatório gerado com sucesso',
        data: reportData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in meta-report:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
