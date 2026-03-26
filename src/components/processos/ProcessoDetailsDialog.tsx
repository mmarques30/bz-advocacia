import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Processo } from "@/types/processos";
import { ProcessoInformacoesTab } from "./tabs/ProcessoInformacoesTab";
import { ProcessoAndamentosTab } from "./tabs/ProcessoAndamentosTab";
import { ProcessoTarefasTab } from "./tabs/ProcessoTarefasTab";
import { ProcessoPrazosTab } from "./tabs/ProcessoPrazosTab";
import { ProcessoDocumentosTab } from "./tabs/ProcessoDocumentosTab";
import { ProcessoFinanceiroTab } from "./tabs/ProcessoFinanceiroTab";
import { ProcessoHistoricoTab } from "./tabs/ProcessoHistoricoTab";
import { ProcessoComunicacaoTab } from "./tabs/ProcessoComunicacaoTab";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProcessoDetailsDialogProps {
  processoId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ProcessoDetailsDialog({ processoId, open, onClose }: ProcessoDetailsDialogProps) {
  const { data: processo, isLoading } = useQuery({
    queryKey: ["processo-detalhes", processoId],
    queryFn: async () => {
      if (!processoId) return null;
      
      const { data, error } = await supabase
        .from("processos")
        .select(`
          *,
          cliente:contact_submissions!processos_lead_id_fkey(
            id,
            nome_completo,
            email,
            telefone
          )
        `)
        .eq("id", processoId)
        .single();

      if (error) throw error;
      return data as Processo;
    },
    enabled: !!processoId && open,
  });

  if (!processoId) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLoading ? "Carregando..." : (
              <>
                Processo {processo?.extrajudicial ? processo?.codigo_interno : (processo?.numero_processo || processo?.tipo)}
                {processo?.extrajudicial && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">Extrajudicial</Badge>
                )}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : processo ? (
          <Tabs defaultValue="informacoes" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="informacoes">Informações</TabsTrigger>
              <TabsTrigger value="andamentos">Andamentos</TabsTrigger>
              <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
              <TabsTrigger value="prazos">Prazos</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="comunicacao">Comunicação</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="informacoes" className="mt-6">
              <ProcessoInformacoesTab processo={processo} />
            </TabsContent>

            <TabsContent value="andamentos" className="mt-6">
              <ProcessoAndamentosTab processoId={processo.id} />
            </TabsContent>

            <TabsContent value="tarefas" className="mt-6">
              <ProcessoTarefasTab processoId={processo.id} />
            </TabsContent>

            <TabsContent value="prazos" className="mt-6">
              <ProcessoPrazosTab processoId={processo.id} />
            </TabsContent>

            <TabsContent value="documentos" className="mt-6">
              <ProcessoDocumentosTab processoId={processo.id} pastaDriveUrl={processo.pasta_drive_url} />
            </TabsContent>

            <TabsContent value="comunicacao" className="mt-6">
              <ProcessoComunicacaoTab processoId={processo.id} processo={processo} />
            </TabsContent>

            <TabsContent value="financeiro" className="mt-6">
              <ProcessoFinanceiroTab processo={processo} />
            </TabsContent>

            <TabsContent value="historico" className="mt-6">
              <ProcessoHistoricoTab processoId={processo.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Processo não encontrado
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
