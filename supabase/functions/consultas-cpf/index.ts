import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConsultaCPFRequest {
  cpf: string;
  dataNascimento: string;
  processo_id?: string;
  motivo: string;
  justificativa: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apifyToken = Deno.env.get('APIFY_API_TOKEN');

    if (!apifyToken) {
      console.error('APIFY_API_TOKEN não configurado');
      return new Response(
        JSON.stringify({ error: 'API do Apify não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Autenticar usuário
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { cpf, dataNascimento, processo_id, motivo, justificativa }: ConsultaCPFRequest = await req.json();

    // Validações
    if (!cpf || !dataNascimento || !motivo || !justificativa) {
      return new Response(
        JSON.stringify({ error: 'CPF, data de nascimento, motivo e justificativa são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar CPF (remover caracteres não numéricos)
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) {
      return new Response(
        JSON.stringify({ error: 'CPF deve ter 11 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Consultando CPF: ${cpfLimpo.substring(0, 3)}.***.***-${cpfLimpo.substring(9)}`);

    // Chamar Apify Actor
    const apifyUrl = 'https://api.apify.com/v2/acts/codsec~consulta-receita-federal-api/run-sync-get-dataset-items';
    
    const apifyResponse = await fetch(apifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tipo: 'CPF',
        cpf: cpfLimpo,
        dataNascimento: dataNascimento,
      }),
    });

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error('Erro do Apify:', apifyResponse.status, errorText);
      
      // Salvar consulta com erro
      await supabase.from('consultas_realizadas').insert({
        tipo_consulta: 'cpf',
        parametro_busca: cpfLimpo,
        processo_id: processo_id || null,
        usuario_id: user.id,
        motivo,
        justificativa,
        status: 'erro',
        mensagem_erro: `Erro Apify: ${apifyResponse.status} - ${errorText.substring(0, 200)}`,
        custo: 0,
      });

      return new Response(
        JSON.stringify({ error: 'Erro ao consultar Apify', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apifyData = await apifyResponse.json();
    console.log('Resposta Apify:', JSON.stringify(apifyData).substring(0, 500));

    // Verificar se retornou dados
    if (!apifyData || apifyData.length === 0) {
      // Salvar consulta sem dados
      const { data: consultaSemDados } = await supabase.from('consultas_realizadas').insert({
        tipo_consulta: 'cpf',
        parametro_busca: cpfLimpo,
        processo_id: processo_id || null,
        usuario_id: user.id,
        motivo,
        justificativa,
        status: 'sem_dados',
        mensagem_erro: 'Nenhum dado encontrado para o CPF informado',
        custo: 1,
      }).select().single();

      // Atualizar contador de créditos
      await supabase.from('apify_config')
        .update({ 
          creditos_usados: supabase.rpc('increment_creditos'),
          ultima_consulta: new Date().toISOString()
        })
        .eq('ativo', true);

      return new Response(
        JSON.stringify({ 
          status: 'sem_dados',
          mensagem: 'Nenhum dado encontrado para o CPF e data de nascimento informados'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar resultado
    const resultado = apifyData[0];
    
    const dadosFormatados = {
      cpf: resultado.cpf || cpfLimpo,
      nome: resultado.nome || resultado.nomeCompleto || 'Não informado',
      dataNascimento: resultado.dataNascimento || dataNascimento,
      situacaoCadastral: resultado.situacaoCadastral || resultado.situacao || 'Não informada',
      dataInscricao: resultado.dataInscricao || null,
      digitoVerificador: resultado.digitoVerificador || null,
      anoObito: resultado.anoObito || null,
      horaConsulta: resultado.horaConsulta || new Date().toISOString(),
      comprovante: resultado.comprovante || null,
    };

    // Salvar consulta com sucesso
    const { data: consultaSucesso, error: insertError } = await supabase.from('consultas_realizadas').insert({
      tipo_consulta: 'cpf',
      parametro_busca: cpfLimpo,
      processo_id: processo_id || null,
      usuario_id: user.id,
      motivo,
      justificativa,
      resultado: dadosFormatados,
      status: 'sucesso',
      custo: 1,
      id_consulta_externa: resultado.id || null,
    }).select().single();

    if (insertError) {
      console.error('Erro ao salvar consulta:', insertError);
    }

    // Atualizar configuração do Apify
    await supabase.from('apify_config')
      .update({ 
        ultima_consulta: new Date().toISOString()
      })
      .eq('ativo', true);

    // Incrementar créditos usados
    await supabase.rpc('increment_apify_creditos');

    console.log('Consulta CPF realizada com sucesso:', consultaSucesso?.id);

    return new Response(
      JSON.stringify({
        status: 'sucesso',
        dados: dadosFormatados,
        metadados: {
          consultadoEm: new Date().toISOString(),
          idConsulta: consultaSucesso?.id,
          fonte: 'Apify - Receita Federal',
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na consulta CPF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
