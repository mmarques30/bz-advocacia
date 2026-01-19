import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, History, FolderOpen } from "lucide-react";
import { GerarContratoForm } from "@/components/documentos/GerarContratoForm";
import { ContratosHistorico } from "@/components/documentos/ContratosHistorico";
import { ModelosContrato } from "@/components/documentos/ModelosContrato";

export default function Documentos() {
  const [activeTab, setActiveTab] = useState("gerar");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
        <p className="text-muted-foreground">
          Gere contratos e documentos automaticamente
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="gerar" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Gerar Contrato
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historico
          </TabsTrigger>
          <TabsTrigger value="modelos" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Modelos
          </TabsTrigger>
        </TabsList>

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
