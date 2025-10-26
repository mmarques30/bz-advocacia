import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProcessoDocumento } from "@/types/processos";
import { toast } from "@/hooks/use-toast";

export function useProcessoDocumentos(processoId: string) {
  return useQuery({
    queryKey: ["processo-documentos", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos_documentos")
        .select("*")
        .eq("processo_id", processoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProcessoDocumento[];
    },
    enabled: !!processoId,
  });
}

export function useUploadDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      processoId,
      andamentoId,
      categoria,
    }: {
      file: File;
      processoId: string;
      andamentoId?: string;
      categoria: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${processoId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('processo-documentos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create documento record
      const { data, error } = await supabase
        .from("processos_documentos")
        .insert({
          processo_id: processoId,
          andamento_id: andamentoId || null,
          nome_arquivo: file.name,
          categoria,
          caminho_storage: fileName,
          tamanho_bytes: file.size,
          mime_type: file.type,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-documentos"] });
      toast({
        title: "Documento enviado",
        description: "O documento foi enviado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documento: ProcessoDocumento) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('processo-documentos')
        .remove([documento.caminho_storage]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase
        .from("processos_documentos")
        .delete()
        .eq("id", documento.id);

      if (error) throw error;
      return documento.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-documentos"] });
      toast({
        title: "Documento excluído",
        description: "O documento foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDownloadDocumento() {
  return useMutation({
    mutationFn: async (documento: ProcessoDocumento) => {
      const { data, error } = await supabase.storage
        .from('processo-documentos')
        .download(documento.caminho_storage);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = documento.nome_arquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast({
        title: "Erro ao baixar documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
