import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentoDrive } from "@/types/documentos-drive";
import { toast } from "@/lib/toast";
import { validarLinkDrive, extrairFileId } from "@/lib/driveUtils";
import { useCreateHistorico } from "./useProcessoHistorico";

export function useDocumentosDrive(processoId: string) {
  return useQuery({
    queryKey: ["documentos-drive", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_drive")
        .select("*")
        .eq("processo_id", processoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DocumentoDrive[];
    },
    enabled: !!processoId,
  });
}

export function useCreateDocumentoDrive() {
  const queryClient = useQueryClient();
  const createHistorico = useCreateHistorico();

  return useMutation({
    mutationFn: async (documento: {
      processo_id: string;
      tipo_documento: string;
      nome: string;
      descricao?: string;
      drive_url: string;
      data_documento?: string;
      tags?: string[];
    }) => {
      // Validar link do Drive
      if (!validarLinkDrive(documento.drive_url)) {
        throw new Error("Link inválido do Google Drive");
      }

      const fileId = extrairFileId(documento.drive_url);
      if (!fileId) {
        throw new Error("Não foi possível extrair o ID do arquivo");
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("documentos_drive")
        .insert({
          ...documento,
          drive_file_id: fileId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      createHistorico.mutate({
        processo_id: documento.processo_id,
        entidade_tipo: "documento_drive",
        entidade_id: data.id,
        acao: "criar",
        valor_novo: documento.nome,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos-drive"] });
      toast({
        title: "Documento vinculado",
        description: "O documento do Google Drive foi vinculado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao vincular documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateDocumentoDrive() {
  const queryClient = useQueryClient();
  const createHistorico = useCreateHistorico();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<DocumentoDrive> & { id: string }) => {
      // Se estiver atualizando a URL, validar
      if (updates.drive_url) {
        if (!validarLinkDrive(updates.drive_url)) {
          throw new Error("Link inválido do Google Drive");
        }

        const fileId = extrairFileId(updates.drive_url);
        if (!fileId) {
          throw new Error("Não foi possível extrair o ID do arquivo");
        }
        updates.drive_file_id = fileId;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("documentos_drive")
        .update({
          ...updates,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      createHistorico.mutate({
        processo_id: data.processo_id,
        entidade_tipo: "documento_drive",
        entidade_id: id,
        acao: "editar",
        campo_alterado: "informações",
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos-drive"] });
      toast({
        title: "Documento atualizado",
        description: "As informações do documento foram atualizadas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDocumentoDrive() {
  const queryClient = useQueryClient();
  const createHistorico = useCreateHistorico();

  return useMutation({
    mutationFn: async ({ id, processoId, nome }: { id: string; processoId: string; nome: string }) => {
      const { error } = await supabase
        .from("documentos_drive")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Registrar no histórico
      createHistorico.mutate({
        processo_id: processoId,
        entidade_tipo: "documento_drive",
        entidade_id: id,
        acao: "deletar",
        valor_anterior: nome,
      });

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos-drive"] });
      toast({
        title: "Documento removido",
        description: "O vínculo do documento foi removido. O arquivo permanece no Google Drive.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
