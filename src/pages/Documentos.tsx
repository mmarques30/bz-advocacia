import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, History, FolderOpen, FileSpreadsheet } from "lucide-react";
import { GerarContratoForm } from "@/components/documentos/GerarContratoForm";
import { GerarPropostaForm } from "@/components/documentos/GerarPropostaForm";
import { ContratosHistorico } from "@/components/documentos/ContratosHistorico";
import { ModelosContrato } from "@/components/documentos/ModelosContrato";

export default function Documentos() {
  const [activeTab, setActiveTab] = useState("proposta");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Documentos</h1>
        <p className="text-muted-foreground">
          Gere propostas e contratos automaticamente
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="proposta" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Proposta
          </TabsTrigger>
          <TabsTrigger value="gerar" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contrato
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="modelos" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Modelos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proposta">
          <GerarPropostaForm />
        </TabsContent>

        <TabsContent value="gerar">
          <GerarContratoForm />
        </TabsContent>

        <TabsContent value="historico">
          <ContratosHistorico />
        </TabsContent>

        <TabsContent value="modelos">
          <ModelosContrato />
        </TabsContent>
      </Tabs>
    </div>
  );
}
