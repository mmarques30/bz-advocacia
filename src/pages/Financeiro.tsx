import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
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
import { FaturamentoKPIs } from "@/components/financeiro/FaturamentoKPIs";
import { FaturamentoCharts } from "@/components/financeiro/FaturamentoCharts";
import { FaturamentoWidgets } from "@/components/financeiro/FaturamentoWidgets";
import { FaturamentoFilters, getDefaultFaturamentoFilters, type FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";
import { DespesasKPIs } from "@/components/financeiro/DespesasKPIs";
import { DespesasCharts } from "@/components/financeiro/DespesasCharts";
import { DespesasWidgets } from "@/components/financeiro/DespesasWidgets";
import { DespesasGlobalFilters, getDefaultDespesasGlobalFilters, type DespesasGlobalFiltersState } from "@/components/financeiro/DespesasGlobalFilters";
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

  // Estados para filtros globais
  const [faturamentoFilters, setFaturamentoFilters] = useState<FaturamentoFiltersState>(getDefaultFaturamentoFilters());
  const [despesasGlobalFilters, setDespesasGlobalFilters] = useState<DespesasGlobalFiltersState>(getDefaultDespesasGlobalFilters());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão Financeira</h1>
        <p className="text-muted-foreground">
          Acompanhe receitas, acordos e pagamentos
        </p>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList>
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral - antiga Controle Financeiro */}
        <TabsContent value="geral" className="space-y-6">
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

        {/* Aba Faturamento - Acordos e Receitas */}
        <TabsContent value="faturamento" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Faturamento</h2>
              <p className="text-sm text-muted-foreground">Gerencie acordos e receitas</p>
            </div>
            <Button onClick={() => setNewAcordoOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Acordo
            </Button>
          </div>
          
          <FaturamentoFilters filters={faturamentoFilters} onChange={setFaturamentoFilters} />
          <FaturamentoKPIs filters={faturamentoFilters} />
          <FaturamentoCharts filters={faturamentoFilters} />
          <FaturamentoWidgets onRegistrarPagamento={setPagamentoParcelaId} filters={faturamentoFilters} />
          
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

        {/* Aba Despesas */}
        <TabsContent value="despesas" className="space-y-6">
          <DespesasAlerts />
          
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Despesas</h2>
              <p className="text-sm text-muted-foreground">Gerencie todas as despesas</p>
            </div>
            <Button onClick={() => setNewDespesaOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </div>
          
          <DespesasGlobalFilters filters={despesasGlobalFilters} onChange={setDespesasGlobalFilters} />
          <DespesasKPIs filters={despesasGlobalFilters} />
          
          <div className="grid gap-6 md:grid-cols-2">
            <DespesasCharts filters={despesasGlobalFilters} />
            <DespesasWidgets filters={despesasGlobalFilters} />
          </div>
          
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
