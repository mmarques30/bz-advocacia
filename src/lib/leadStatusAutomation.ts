import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";

const ESTAGIOS_ANTERIORES = ['novo', 'contato_inicial', 'em_analise'];

/**
 * Atualiza o estágio do lead para 'proposta_enviada' se estiver em um estágio anterior,
 * e registra a atividade no histórico.
 */
export async function atualizarLeadParaPropostaEnviada(
  clienteId: string,
  tipoDocumento: 'proposta' | 'contrato',
  queryClient: QueryClient
) {
  try {
    // 1. Buscar estágio atual
    const { data: lead, error: fetchError } = await supabase
      .from('contact_submissions')
      .select('estagio')
      .eq('id', clienteId)
      .single();

    if (fetchError || !lead) return;

    // 2. Só atualizar se estiver em estágio anterior
    if (!ESTAGIOS_ANTERIORES.includes(lead.estagio || '')) return;

    // 3. Atualizar estágio
    await supabase
      .from('contact_submissions')
      .update({
        estagio: 'proposta_enviada',
        data_ultima_atividade: new Date().toISOString(),
      })
      .eq('id', clienteId);

    // 4. Registrar atividade
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('atividades').insert({
      tipo: 'proposta_enviada',
      descricao: tipoDocumento === 'proposta'
        ? 'Proposta gerada automaticamente pelo sistema'
        : 'Contrato gerado automaticamente pelo sistema',
      entidade_tipo: 'lead',
      entidade_id: clienteId,
      usuario_id: user?.id || null,
    });

    // 5. Invalidar queries
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['leads-simple'] });
    queryClient.invalidateQueries({ queryKey: ['lead-activities'] });
  } catch (error) {
    console.error('Erro ao atualizar status do lead:', error);
  }
}

/**
 * Atualiza o lead para 'fechado' e status_cliente 'ativo' ao emitir contrato.
 * Aceita qualquer estágio exceto 'perdido' e 'fechado'.
 */
export async function atualizarLeadParaFechado(
  clienteId: string,
  queryClient: QueryClient
) {
  try {
    const { data: lead, error: fetchError } = await supabase
      .from('contact_submissions')
      .select('estagio')
      .eq('id', clienteId)
      .single();

    if (fetchError || !lead) return;

    if (lead.estagio === 'perdido' || lead.estagio === 'fechado') return;

    await supabase
      .from('contact_submissions')
      .update({
        estagio: 'fechado',
        status_cliente: 'ativo',
        data_ultima_atividade: new Date().toISOString(),
      })
      .eq('id', clienteId);

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('atividades').insert({
      tipo: 'lead_convertido',
      descricao: 'Contrato emitido - lead convertido em cliente',
      entidade_tipo: 'lead',
      entidade_id: clienteId,
      usuario_id: user?.id || null,
    });

    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['leads-simple'] });
    queryClient.invalidateQueries({ queryKey: ['lead-activities'] });
  } catch (error) {
    console.error('Erro ao atualizar lead para fechado:', error);
  }
}
