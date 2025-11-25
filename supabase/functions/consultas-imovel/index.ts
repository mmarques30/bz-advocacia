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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Não autorizado');
    }

    const { tipo, valor, cidade, uf, cep, processo_id, motivo, justificativa } = await req.json();

    // Buscar configuração da API
    const { data: config } = await supabase
      .from('consultas_config')
      .select('*')
      .single();

    if (!config || !config.api_token || !config.ativo) {
      await supabase.from('consultas_realizadas').insert({
        tipo_consulta: 'imovel',
        parametro_busca: valor,
        processo_id: processo_id || null,
        usuario_id: user.id,
        motivo,
        justificativa,
        status: 'api_nao_configurada',
        mensagem_erro: 'API não está configurada ou ativa',
        custo: 0,
      });

      return new Response(
        JSON.stringify({
          error: 'API não configurada',
          message: 'Configure as credenciais da API em Configurações antes de realizar consultas',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // TODO: Implementar chamada real para BigDataCorp API
    const resultadoExemplo = {
      dados: {
        endereco: valor,
        cidade: cidade || 'São Paulo',
        uf: uf || 'SP',
        cep: cep || '01234-000',
        area: 120,
        tipo: 'RESIDENCIAL',
        proprietario: {
          nome: 'JOÃO DA SILVA',
          cpfCnpj: '***456.789-**',
        },
        valor: 450000,
        registros: [
          {
            tipo: 'Compra e Venda',
            data: '15/03/2020',
            descricao: 'Registro de compra e venda',
          },
        ],
      },
      metadados: {
        consultadoEm: new Date().toISOString(),
        custo: 3.00,
        idConsulta: `CNS-${Date.now()}`,
      },
    };

    // Registrar consulta no banco
    await supabase.from('consultas_realizadas').insert({
      tipo_consulta: 'imovel',
      parametro_busca: valor,
      processo_id: processo_id || null,
      usuario_id: user.id,
      motivo,
      justificativa,
      resultado: resultadoExemplo,
      status: 'sucesso',
      custo: 3.00,
      id_consulta_externa: resultadoExemplo.metadados.idConsulta,
    });

    console.log(`Consulta de imóvel realizada: ${valor} por ${user.email}`);

    return new Response(
      JSON.stringify(resultadoExemplo),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
