import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RelatorioKPIs } from "@/components/relatorios-vendas/RelatorioKPIs";
import { RelatorioComparativo } from "@/components/relatorios-vendas/RelatorioComparativo";
import { RelatorioCampanhas } from "@/components/relatorios-vendas/RelatorioCampanhas";
import { RelatorioFunil } from "@/components/relatorios-vendas/RelatorioFunil";
import { RelatorioFilters } from "@/components/relatorios-vendas/RelatorioFilters";
import { RelatorioExport } from "@/components/relatorios-vendas/RelatorioExport";
import { useRelatoriosVendas, PeriodoRelatorio } from "@/hooks/useRelatoriosVendas";
import { FileBarChart } from "lucide-react";

export default function RelatoriosVendas() {
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>("mensal");
  const { data, isLoading } = useRelatoriosVendas(periodo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileBarChart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios de Vendas</h1>
            <p className="text-muted-foreground">
              Relatórios para compartilhar com sua agência de marketing
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <RelatorioFilters periodo={periodo} onPeriodoChange={setPeriodo} />
          <RelatorioExport periodo={periodo} />
        </div>
      </div>

      {/* KPIs */}
      <RelatorioKPIs kpis={data?.kpis} isLoading={isLoading} />

      {/* Tabs de conteúdo */}
      <Tabs defaultValue="comparativo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
          <TabsTrigger value="campanhas">Por Campanha</TabsTrigger>
          <TabsTrigger value="funil">Funil</TabsTrigger>
        </TabsList>

        <TabsContent value="comparativo" className="space-y-4">
          <RelatorioComparativo 
            comparativo={data?.comparativo} 
            periodo={periodo}
            isLoading={isLoading} 
          />
        </TabsContent>

        <TabsContent value="campanhas" className="space-y-4">
          <RelatorioCampanhas 
            campanhas={data?.campanhas} 
            isLoading={isLoading} 
          />
        </TabsContent>

        <TabsContent value="funil" className="space-y-4">
          <RelatorioFunil 
            funil={data?.funil} 
            isLoading={isLoading} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
