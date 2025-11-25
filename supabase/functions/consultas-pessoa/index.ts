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

    const {
      tipo,
      valor,
      incluirEnderecos,
      incluirTelefones,
      incluirEmails,
      incluirScore,
      processo_id,
      motivo,
      justificativa,
    } = await req.json();

    // Buscar configuração da API
    const { data: config } = await supabase
      .from('consultas_config')
      .select('*')
      .single();

    if (!config || !config.api_token || !config.ativo) {
      await supabase.from('consultas_realizadas').insert({
        tipo_consulta: 'pessoa',
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
      identificacao: {
        nome: 'JOÃO DA SILVA',
        cpf: valor,
        dataNascimento: '15/03/1985',
        idade: 39,
        situacaoCPF: 'REGULAR',
        naturalidade: 'São Paulo - SP',
      },
      enderecos: incluirEnderecos ? [
        {
          logradouro: 'RUA DAS FLORES',
          numero: '123',
          complemento: 'APT 45',
          bairro: 'JARDIM PAULISTA',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01234-000',
          tipo: 'Residencial',
          ultimaAtualizacao: '05/2024',
        },
      ] : [],
      telefones: incluirTelefones ? [
        {
          numero: '(11) 98765-4321',
          tipo: 'celular' as const,
          operadora: 'Vivo',
          status: 'Ativo',
        },
      ] : [],
      emails: incluirEmails ? ['joao.silva@email.com'] : [],
      situacaoFinanceira: incluirScore ? {
        possuiRestricoes: true,
        protestos: 2,
        valorTotal: 15430.00,
      } : undefined,
      metadados: {
        consultadoEm: new Date().toISOString(),
        custo: 2.50,
        idConsulta: `CNS-${Date.now()}`,
      },
    };

    // Registrar consulta no banco
    await supabase.from('consultas_realizadas').insert({
      tipo_consulta: 'pessoa',
      parametro_busca: valor,
      processo_id: processo_id || null,
      usuario_id: user.id,
      motivo,
      justificativa,
      resultado: resultadoExemplo,
      status: 'sucesso',
      custo: 2.50,
      id_consulta_externa: resultadoExemplo.metadados.idConsulta,
    });

    console.log(`Consulta de pessoa realizada: ${valor} por ${user.email}`);

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
