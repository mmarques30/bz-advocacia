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

export interface TemplateVersao {
  id: string;
  template_id: string;
  versao: number;
  nome: string;
  conteudo: string;
  descricao: string | null;
  variaveis: string[] | null;
  editado_por: string | null;
  created_at: string;
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
      const { data: user } = await supabase.auth.getUser();
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
          criado_por: user?.user?.id || null,
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
    onError: (error: any) => {
      console.error('Erro ao salvar modelo:', error);
      toast.error(error?.message || 'Erro ao salvar modelo');
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

// Hook para buscar versões anteriores de um template
export const useModeloVersoes = (templateId: string | null) => {
  return useQuery({
    queryKey: ['modelo-versoes', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from('templates_versoes')
        .select('*')
        .eq('template_id', templateId)
        .order('versao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar versões:', error);
        throw error;
      }
      return data as TemplateVersao[];
    },
    enabled: !!templateId,
  });
};

// Hook para atualizar modelo com versionamento
export const useUpdateModelo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      nome,
      categoria,
      descricao,
      conteudo,
      variaveis,
    }: {
      id: string;
      nome: string;
      categoria: string;
      descricao: string;
      conteudo: string;
      variaveis: string[];
    }) => {
      // 1. Buscar dados atuais para salvar como versão
      const { data: current, error: fetchError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // 2. Contar versões existentes para incrementar
      const { count } = await supabase
        .from('templates_versoes')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', id);

      const nextVersion = (count || 0) + 1;

      // 3. Salvar versão anterior
      const { error: versionError } = await supabase
        .from('templates_versoes')
        .insert({
          template_id: id,
          versao: nextVersion,
          nome: current.nome,
          conteudo: current.conteudo,
          descricao: current.descricao,
          variaveis: current.variaveis,
          editado_por: (await supabase.auth.getUser()).data.user?.id || null,
        });

      if (versionError) throw versionError;

      // 4. Montar novo conteúdo JSON
      let parsedConteudo: ModeloConteudo = { servico_padrao: '', tipo_modelo: 'contrato', fonte: 'upload_ia' };
      try {
        parsedConteudo = JSON.parse(current.conteudo);
      } catch {}
      parsedConteudo.servico_padrao = conteudo;
      parsedConteudo.tipo_identificado = categoria;

      // 5. Atualizar template
      const { data: updated, error: updateError } = await supabase
        .from('templates')
        .update({
          nome,
          categoria,
          descricao,
          conteudo: JSON.stringify(parsedConteudo),
          variaveis,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-personalizados'] });
      queryClient.invalidateQueries({ queryKey: ['modelo-versoes'] });
      toast.success('Modelo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar modelo:', error);
      toast.error('Erro ao atualizar modelo');
    },
  });
};

// Hook para desativar (excluir logicamente) um modelo
export const useDeleteModelo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('templates')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-personalizados'] });
      toast.success('Modelo excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir modelo');
    },
  });
};

// Hook para duplicar modelo (personalizado ou padrão)
export const useDuplicarModelo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modelo: {
      nome: string;
      tipo: string;
      categoria: string;
      conteudo: string;
      descricao: string | null;
      variaveis: string[] | null;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('templates')
        .insert({
          nome: `${modelo.nome} (cópia)`,
          tipo: modelo.tipo,
          categoria: modelo.categoria,
          conteudo: modelo.conteudo,
          descricao: modelo.descricao,
          ativo: true,
          variaveis: modelo.variaveis || [],
          criado_por: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-personalizados'] });
      toast.success('Modelo duplicado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao duplicar modelo');
    },
  });
};
