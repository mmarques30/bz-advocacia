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

    const { tipo, valor, processo_id, motivo, justificativa } = await req.json();

    // Buscar configuração da API
    const { data: config } = await supabase
      .from('consultas_config')
      .select('*')
      .single();

    if (!config || !config.api_token || !config.ativo) {
      // Registrar consulta como API não configurada
      await supabase.from('consultas_realizadas').insert({
        tipo_consulta: 'veiculo',
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

    // TODO: Implementar chamada real para BigDataCorp API quando tiver credenciais
    // Por enquanto, retornar dados de exemplo
    const resultadoExemplo = {
      status: 'success',
      dados: {
        placa: valor.toUpperCase(),
        renavam: '12345678901',
        chassi: '****4251',
        marca: 'VOLKSWAGEN',
        modelo: 'GOL 1.0',
        anoFabricacao: 2020,
        anoModelo: 2021,
        cor: 'PRATA',
        combustivel: 'FLEX',
        categoria: 'PARTICULAR',
        situacao: {
          status: 'REGULAR',
          ufLicenciamento: 'SP',
          municipio: 'São Paulo',
          licenciadoAte: '31/12/2024',
        },
        restricoes: {
          rouboFurto: false,
          financiamento: {
            ativo: true,
            instituicao: 'BANCO ITAÚ S.A',
          },
          judicial: false,
          administrativa: false,
        },
        proprietario: {
          nome: 'JOÃO DA SILVA',
          cpfCnpj: '***456.789-**',
          municipio: 'São Paulo',
          uf: 'SP',
        },
        debitos: {
          ipva: 0,
          multas: 389.76,
          licenciamento: 0,
          total: 389.76,
        },
      },
      metadados: {
        consultadoEm: new Date().toISOString(),
        custo: 1.50,
        idConsulta: `CNS-${Date.now()}`,
      },
    };

    // Registrar consulta no banco
    await supabase.from('consultas_realizadas').insert({
      tipo_consulta: 'veiculo',
      parametro_busca: valor,
      processo_id: processo_id || null,
      usuario_id: user.id,
      motivo,
      justificativa,
      resultado: resultadoExemplo,
      status: 'sucesso',
      custo: 1.50,
      id_consulta_externa: resultadoExemplo.metadados.idConsulta,
    });

    console.log(`Consulta de veículo realizada: ${valor} por ${user.email}`);

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
