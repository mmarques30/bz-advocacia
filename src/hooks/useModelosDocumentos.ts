import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ModeloPersonalizado {
  id: string;
  nome: string;
  tipo: string;
  categoria: string | null;
  conteudo: string;
  descricao: string | null;
  ativo: boolean;
  variaveis: string[] | null;
  created_at: string;
}

export interface ModeloConteudo {
  servico_padrao: string;
  tipo_modelo: string;
  fonte: string;
  tipo_identificado?: string;
}

export const useModelosPersonalizados = (tipo: 'proposta' | 'contrato') => {
  return useQuery({
    queryKey: ['modelos-personalizados', tipo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('tipo', tipo)
        .eq('ativo', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar modelos:', error);
        throw error;
      }
      
      return data as ModeloPersonalizado[];
    }
  });
};

export const useSaveModelo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modelo: {
      nome: string;
      tipo: 'proposta' | 'contrato';
      categoria: string;
      servico_padrao: string;
      descricao: string;
      variaveis: string[];
    }) => {
      const conteudo: ModeloConteudo = {
        servico_padrao: modelo.servico_padrao,
        tipo_modelo: modelo.tipo,
        fonte: 'upload_ia',
        tipo_identificado: modelo.categoria,
      };

      const { data, error } = await supabase
        .from('templates')
        .insert({
          nome: modelo.nome,
          tipo: modelo.tipo,
          categoria: modelo.categoria,
          conteudo: JSON.stringify(conteudo),
          descricao: modelo.descricao,
          ativo: true,
          variaveis: modelo.variaveis,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar modelo:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['modelos-personalizados', variables.tipo] });
      toast.success('Modelo salvo com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao salvar modelo:', error);
      toast.error('Erro ao salvar modelo');
    }
  });
};

export const useAnalyzeDocument = () => {
  return useMutation({
    mutationFn: async ({ content, tipo }: { content: string; tipo: 'proposta' | 'contrato' }) => {
      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: { content, tipo }
      });

      if (error) {
        console.error('Erro ao analisar documento:', error);
        throw error;
      }

      return data as {
        servico_padrao: string;
        tipo_identificado: string;
        descricao_modelo: string;
        variaveis: string[];
      };
    }
  });
};
