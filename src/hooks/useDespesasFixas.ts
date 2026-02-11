import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { DespesaFixa } from "@/types/financeiro";

export function useDespesasFixas() {
  return useQuery({
    queryKey: ['despesas-fixas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('despesas_fixas')
        .select('*')
        .eq('ativa', true)
        .order('descricao');

      if (error) throw error;
      return data as DespesaFixa[];
    },
  });
}

export function useCreateDespesaFixa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (despesa: Omit<DespesaFixa, 'id' | 'created_at' | 'created_by' | 'ativa'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('despesas_fixas')
        .insert({ ...despesa, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-fixas'] });
      toast.success('Despesa fixa cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar: ' + error.message);
    },
  });
}

export function useUpdateDespesaFixa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<DespesaFixa> & { id: string }) => {
      const { error } = await supabase
        .from('despesas_fixas')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-fixas'] });
      toast.success('Despesa fixa atualizada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });
}

export function useDesativarDespesaFixa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('despesas_fixas')
        .update({ ativa: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-fixas'] });
      toast.success('Despesa fixa desativada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao desativar: ' + error.message);
    },
  });
}

export function useGerarDespesasFixasMes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const hoje = new Date();
      const mesAtual = format(hoje, 'yyyy-MM');

      // Buscar fixas ativas
      const { data: fixas, error: e1 } = await supabase
        .from('despesas_fixas')
        .select('*')
        .eq('ativa', true);

      if (e1) throw e1;
      if (!fixas || fixas.length === 0) return 0;

      // Buscar ocorrências já geradas neste mês
      const { data: jaGeradas, error: e2 } = await supabase
        .from('despesas')
        .select('despesa_fixa_id')
        .not('despesa_fixa_id', 'is', null)
        .gte('data', `${mesAtual}-01`)
        .lte('data', `${mesAtual}-31`);

      if (e2) throw e2;

      const idsJaGerados = new Set(jaGeradas?.map(d => d.despesa_fixa_id));

      const novas = fixas
        .filter(f => !idsJaGerados.has(f.id))
        .map(f => ({
          descricao: f.descricao,
          valor: f.valor,
          data: `${mesAtual}-${String(Math.min(f.dia_vencimento, 28)).padStart(2, '0')}`,
          categoria: f.categoria,
          conta: f.conta,
          status: 'pendente',
          despesa_fixa_id: f.id,
          observacoes: 'Gerada automaticamente - Despesa fixa',
        }));

      if (novas.length > 0) {
        const { error: e3 } = await supabase.from('despesas').insert(novas);
        if (e3) throw e3;
      }

      return novas.length;
    },
    onSuccess: (count) => {
      if (count && count > 0) {
        queryClient.invalidateQueries({ queryKey: ['despesas'] });
        toast.info(`${count} despesa(s) fixa(s) gerada(s) para este mês.`);
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao gerar despesas fixas: ' + error.message);
    },
  });
}
