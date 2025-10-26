import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceiroKPIs } from "@/components/financeiro/FinanceiroKPIs";
import { FinanceiroCharts } from "@/components/financeiro/FinanceiroCharts";
import { FinanceiroWidgets } from "@/components/financeiro/FinanceiroWidgets";
import { AcordosHeader } from "@/components/financeiro/AcordosHeader";
import { AcordosTable } from "@/components/financeiro/AcordosTable";
import { NewAcordoDialog } from "@/components/financeiro/NewAcordoDialog";
import { AcordoDetailsDialog } from "@/components/financeiro/AcordoDetailsDialog";
import { RegistrarPagamentoDialog } from "@/components/financeiro/RegistrarPagamentoDialog";
import type { AcordosFilters } from "@/types/financeiro";

export default function Financeiro() {
  const [filters, setFilters] = useState<AcordosFilters>({});
  const [newAcordoOpen, setNewAcordoOpen] = useState(false);
  const [selectedAcordoId, setSelectedAcordoId] = useState<string | null>(null);
  const [pagamentoParcelaId, setPagamentoParcelaId] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão Financeira</h1>
          <p className="text-muted-foreground">
            Acompanhe receitas, acordos e pagamentos
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="acordos">Acordos</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <FinanceiroKPIs />
            <FinanceiroCharts />
            <FinanceiroWidgets 
              onRegistrarPagamento={setPagamentoParcelaId}
            />
          </TabsContent>

          <TabsContent value="acordos" className="space-y-6">
            <AcordosHeader 
              onNewAcordo={() => setNewAcordoOpen(true)}
              filters={filters}
              onFiltersChange={setFilters}
            />
            <AcordosTable 
              filters={filters}
              onSelectAcordo={setSelectedAcordoId}
              onRegistrarPagamento={setPagamentoParcelaId}
            />
          </TabsContent>
        </Tabs>

        <NewAcordoDialog 
          open={newAcordoOpen}
          onClose={() => setNewAcordoOpen(false)}
        />

        <AcordoDetailsDialog 
          acordoId={selectedAcordoId}
          open={!!selectedAcordoId}
          onClose={() => setSelectedAcordoId(null)}
          onRegistrarPagamento={setPagamentoParcelaId}
        />

        <RegistrarPagamentoDialog 
          parcelaId={pagamentoParcelaId}
          open={!!pagamentoParcelaId}
          onClose={() => setPagamentoParcelaId(null)}
        />
      </div>
    </DashboardLayout>
  );
}
