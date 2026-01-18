import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
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
import { TransacoesKPIs } from "@/components/financeiro/transacoes/TransacoesKPIs";
import { TransacoesCharts } from "@/components/financeiro/transacoes/TransacoesCharts";
import { TransacoesFilters } from "@/components/financeiro/transacoes/TransacoesFilters";
import { TransacoesTable } from "@/components/financeiro/transacoes/TransacoesTable";
import { NewTransacaoDialog } from "@/components/financeiro/transacoes/NewTransacaoDialog";
import { ImportTransacoesDialog } from "@/components/financeiro/transacoes/ImportTransacoesDialog";
import type { AcordosFilters, DespesasFilters } from "@/types/financeiro";
import type { TransacoesFilters as TFilters } from "@/types/transacoes";

export default function Financeiro() {
  const [filters, setFilters] = useState<AcordosFilters>({});
  const [newAcordoOpen, setNewAcordoOpen] = useState(false);
  const [selectedAcordoId, setSelectedAcordoId] = useState<string | null>(null);
  const [pagamentoParcelaId, setPagamentoParcelaId] = useState<string | null>(null);
  
  // Estados para despesas
  const [despesasFilters, setDespesasFilters] = useState<DespesasFilters>({});
  const [newDespesaOpen, setNewDespesaOpen] = useState(false);
  const [selectedDespesaId, setSelectedDespesaId] = useState<string | null>(null);

  // Estados para transações
  const [transacoesFilters, setTransacoesFilters] = useState<TFilters>({});
  const [newTransacaoOpen, setNewTransacaoOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão Financeira</h1>
        <p className="text-muted-foreground">
          Acompanhe receitas, acordos e pagamentos
        </p>
      </div>

      <Tabs defaultValue="controle" className="space-y-6">
        <TabsList>
          <TabsTrigger value="controle">Controle Financeiro</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="acordos">Acordos</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="controle" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Transações Financeiras</h2>
              <p className="text-sm text-muted-foreground">Gerencie receitas e despesas</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button onClick={() => setNewTransacaoOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </div>
          </div>
          <TransacoesKPIs />
          <TransacoesCharts />
          <TransacoesFilters filters={transacoesFilters} onFiltersChange={setTransacoesFilters} />
          <TransacoesTable filters={transacoesFilters} />
        </TabsContent>

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

      <NewTransacaoDialog
        open={newTransacaoOpen}
        onClose={() => setNewTransacaoOpen(false)}
      />

      <ImportTransacoesDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
