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
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProcessoDetailsInlineProps {
  processoId: string;
  onBack: () => void;
  clienteNome: string;
}

export function ProcessoDetailsInline({ processoId, onBack, clienteNome }: ProcessoDetailsInlineProps) {
  const { data: processo, isLoading } = useQuery({
    queryKey: ["processo-detalhes", processoId],
    queryFn: async () => {
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
    enabled: !!processoId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Voltar para {clienteNome}
        </Button>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Voltar para {clienteNome}
        </Button>
        <div className="text-center py-8 text-muted-foreground">
          Processo não encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Voltar para {clienteNome}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">
          Processo {processo.extrajudicial ? processo.codigo_interno : (processo.numero_processo || processo.tipo)}
        </h2>
        {processo.extrajudicial && (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">Extrajudicial</Badge>
        )}
      </div>

      <Tabs defaultValue="informacoes" className="w-full">
        <TabsList className="flex w-full overflow-x-auto">
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
    </div>
  );
}
