import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceiroKPIs } from "@/components/financeiro/FinanceiroKPIs";
import { FinanceiroCharts } from "@/components/financeiro/FinanceiroCharts";
import { FinanceiroWidgets } from "@/components/financeiro/FinanceiroWidgets";
import { DespesasAlerts } from "@/components/financeiro/DespesasAlerts";
import { AcordosHeader } from "@/components/financeiro/AcordosHeader";
import { AcordosTable } from "@/components/financeiro/AcordosTable";
import { NewAcordoDialog } from "@/components/financeiro/NewAcordoDialog";
import { AcordoDetailsDialog } from "@/components/financeiro/AcordoDetailsDialog";
import { RegistrarPagamentoDialog } from "@/components/financeiro/RegistrarPagamentoDialog";
import { DespesasHeader } from "@/components/financeiro/despesas/DespesasHeader";
import { DespesasTable } from "@/components/financeiro/despesas/DespesasTable";
import { NewDespesaDialog } from "@/components/financeiro/despesas/NewDespesaDialog";
import { DespesaDetailsDialog } from "@/components/financeiro/despesas/DespesaDetailsDialog";
import type { AcordosFilters, DespesasFilters } from "@/types/financeiro";

export default function Financeiro() {
  const [filters, setFilters] = useState<AcordosFilters>({});
  const [newAcordoOpen, setNewAcordoOpen] = useState(false);
  const [selectedAcordoId, setSelectedAcordoId] = useState<string | null>(null);
  const [pagamentoParcelaId, setPagamentoParcelaId] = useState<string | null>(null);
  
  // Estados para despesas
  const [despesasFilters, setDespesasFilters] = useState<DespesasFilters>({});
  const [newDespesaOpen, setNewDespesaOpen] = useState(false);
  const [selectedDespesaId, setSelectedDespesaId] = useState<string | null>(null);

  return (
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
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DespesasAlerts />
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

        <TabsContent value="despesas" className="space-y-6">
          <DespesasHeader 
            onNewDespesa={() => setNewDespesaOpen(true)}
            filters={despesasFilters}
            onFiltersChange={setDespesasFilters}
          />
          <DespesasTable 
            filters={despesasFilters}
            onSelectDespesa={setSelectedDespesaId}
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

      <NewDespesaDialog 
        open={newDespesaOpen}
        onClose={() => setNewDespesaOpen(false)}
      />

      <DespesaDetailsDialog 
        despesaId={selectedDespesaId}
        open={!!selectedDespesaId}
        onClose={() => setSelectedDespesaId(null)}
      />
    </div>
  );
}
