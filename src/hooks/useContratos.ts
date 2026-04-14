import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { Contrato, ContratoFilters } from "@/types/contratos";
import { Json } from "@/integrations/supabase/types";

export const useContratos = (filters?: ContratoFilters) => {
  return useQuery({
    queryKey: ['contratos', filters],
    queryFn: async () => {
      let query = supabase
        .from('contratos_gerados')
        .select(`
          *,
          cliente:contact_submissions(nome_completo, email, telefone)
        `)
        .order('created_at', { ascending: false });

      if (filters?.cliente_id) {
        query = query.eq('cliente_id', filters.cliente_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.tipo_contrato) {
        query = query.eq('tipo_contrato', filters.tipo_contrato);
      }
      if (filters?.busca) {
        query = query.ilike('titulo', `%${filters.busca}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Contrato[];
    },
  });
};

interface CreateContratoData {
  cliente_id: string;
  template_id?: string;
  titulo: string;
  tipo_contrato: string;
  conteudo_final: string;
  valores: Record<string, unknown>;
  dados_contrato: Record<string, unknown>;
  status?: string;
}

export const useCreateContrato = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateContratoData) => {
      const { data: contrato, error } = await supabase
        .from('contratos_gerados')
        .insert([{
          cliente_id: data.cliente_id,
          template_id: data.template_id,
          titulo: data.titulo,
          tipo_contrato: data.tipo_contrato,
          conteudo_final: data.conteudo_final,
          valores: data.valores as Json,
          dados_contrato: data.dados_contrato as Json,
          status: data.status || 'rascunho',
        }])
        .select()
        .single();

      if (error) throw error;
      return contrato;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Contrato criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar contrato: ' + error.message);
    },
  });
};

export const useUpdateContrato = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const { data: contrato, error } = await supabase
        .from('contratos_gerados')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return contrato;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Contrato atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar contrato: ' + error.message);
    },
  });
};

export const useDeleteContrato = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contratos_gerados')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Contrato excluído com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir contrato: ' + error.message);
    },
  });
};

export const usePropostasCliente = (clienteId: string) => {
  return useQuery({
    queryKey: ['propostas-cliente', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_gerados')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });
};

export const useUploadContratoPDF = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contratoId, pdfBlob }: { contratoId: string; pdfBlob: Blob }) => {
      const fileName = `${contratoId}-${Date.now()}.pdf`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contratos-pdf')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('contratos-pdf')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('contratos_gerados')
        .update({ pdf_url: publicUrl, status: 'finalizado' })
        .eq('id', contratoId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('PDF gerado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao gerar PDF: ' + error.message);
    },
  });
};

export const useUpdateClienteDados = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase
        .from('contact_submissions')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-simple'] });
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Dados do cliente atualizados');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar dados: ' + error.message);
    },
  });
};
