import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { DespesasAlerts } from "@/components/financeiro/DespesasAlerts";
import { AcordosTable } from "@/components/financeiro/AcordosTable";
import { NewAcordoDialog } from "@/components/financeiro/NewAcordoDialog";
import { AcordoDetailsDialog } from "@/components/financeiro/AcordoDetailsDialog";
import { RegistrarPagamentoDialog } from "@/components/financeiro/RegistrarPagamentoDialog";
import { DespesasTable } from "@/components/financeiro/despesas/DespesasTable";
import { NewDespesaDialog } from "@/components/financeiro/despesas/NewDespesaDialog";
import { DespesaDetailsDialog } from "@/components/financeiro/despesas/DespesaDetailsDialog";
import { TransacoesKPIs } from "@/components/financeiro/transacoes/TransacoesKPIs";
import { TransacoesCharts } from "@/components/financeiro/transacoes/TransacoesCharts";
import { TransacoesFilters } from "@/components/financeiro/transacoes/TransacoesFilters";
import { TransacoesTable } from "@/components/financeiro/transacoes/TransacoesTable";
import { FaturamentoKPIs } from "@/components/financeiro/FaturamentoKPIs";
import { FaturamentoCharts } from "@/components/financeiro/FaturamentoCharts";
import { FaturamentoWidgets } from "@/components/financeiro/FaturamentoWidgets";
import { FaturamentoFilters, getDefaultFaturamentoFilters, type FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";
import { ImportFaturamentoDialog } from "@/components/financeiro/ImportFaturamentoDialog";
import { DespesasKPIs } from "@/components/financeiro/DespesasKPIs";
import { DespesasCharts } from "@/components/financeiro/DespesasCharts";
import { DespesasWidgets } from "@/components/financeiro/DespesasWidgets";
import { DespesasGlobalFilters, getDefaultDespesasGlobalFilters, type DespesasGlobalFiltersState } from "@/components/financeiro/DespesasGlobalFilters";
import { ImportDespesasDialog } from "@/components/financeiro/despesas/ImportDespesasDialog";
import type { AcordosFilters } from "@/types/financeiro";
import type { TransacoesFilters as TFilters } from "@/types/transacoes";

export default function Financeiro() {
  const [newAcordoOpen, setNewAcordoOpen] = useState(false);
  const [selectedAcordoId, setSelectedAcordoId] = useState<string | null>(null);
  const [pagamentoParcelaId, setPagamentoParcelaId] = useState<string | null>(null);
  
  // Estados para despesas
  const [newDespesaOpen, setNewDespesaOpen] = useState(false);
  const [selectedDespesaId, setSelectedDespesaId] = useState<string | null>(null);

  // Estados para transações (Visão Geral)
  const [transacoesFilters, setTransacoesFilters] = useState<TFilters>({ ano: new Date().getFullYear() });

  // Estados para filtros globais e dialogs de importação
  const [faturamentoFilters, setFaturamentoFilters] = useState<FaturamentoFiltersState>(getDefaultFaturamentoFilters());
  const [importFaturamentoOpen, setImportFaturamentoOpen] = useState(false);
  
  const [despesasGlobalFilters, setDespesasGlobalFilters] = useState<DespesasGlobalFiltersState>(getDefaultDespesasGlobalFilters());
  const [importDespesasOpen, setImportDespesasOpen] = useState(false);

  // Converter filtros globais para filtros de tabela
  const acordosFiltersFromGlobal: AcordosFilters = {
    search: faturamentoFilters.search,
    status: faturamentoFilters.status ? [faturamentoFilters.status as any] : undefined,
    tipo_servico: faturamentoFilters.tipoServico,
  };

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

        {/* Aba Visão Geral */}
        <TabsContent value="geral" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Transações Financeiras</h2>
            <p className="text-sm text-muted-foreground">Visão consolidada de receitas e despesas</p>
          </div>
          
          {/* Filtros no topo */}
          <TransacoesFilters filters={transacoesFilters} onFiltersChange={setTransacoesFilters} />
          
          {/* KPIs e Charts filtrados */}
          <TransacoesKPIs filters={transacoesFilters} />
          <TransacoesCharts filters={transacoesFilters} />
          
          {/* Tabela filtrada */}
          <TransacoesTable filters={transacoesFilters} />
        </TabsContent>

        {/* Aba Faturamento - Acordos e Receitas */}
        <TabsContent value="faturamento" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Faturamento</h2>
              <p className="text-sm text-muted-foreground">Gerencie acordos e receitas</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportFaturamentoOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button onClick={() => setNewAcordoOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Acordo
              </Button>
            </div>
          </div>
          
          {/* Filtros globais no topo */}
          <FaturamentoFilters filters={faturamentoFilters} onChange={setFaturamentoFilters} />
          
          {/* Componentes filtrados */}
          <FaturamentoKPIs filters={faturamentoFilters} />
          <FaturamentoCharts filters={faturamentoFilters} />
          <FaturamentoWidgets onRegistrarPagamento={setPagamentoParcelaId} filters={faturamentoFilters} />
          
          {/* Tabela de Acordos usando filtros globais */}
          <AcordosTable 
            filters={acordosFiltersFromGlobal}
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportDespesasOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button onClick={() => setNewDespesaOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Despesa
              </Button>
            </div>
          </div>
          
          {/* Filtros globais no topo */}
          <DespesasGlobalFilters filters={despesasGlobalFilters} onChange={setDespesasGlobalFilters} />
          
          {/* Componentes filtrados */}
          <DespesasKPIs filters={despesasGlobalFilters} />
          
          <div className="grid gap-6 md:grid-cols-2">
            <DespesasCharts filters={despesasGlobalFilters} />
            <DespesasWidgets filters={despesasGlobalFilters} />
          </div>
          
          {/* Tabela usando filtros globais convertidos */}
          <DespesasTable 
            filters={{
              search: despesasGlobalFilters.search,
              categoria: despesasGlobalFilters.categoria ? [despesasGlobalFilters.categoria as any] : undefined,
              status: despesasGlobalFilters.status ? [despesasGlobalFilters.status as any] : undefined,
            }}
            onSelectDespesa={setSelectedDespesaId}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs de Faturamento */}
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

      <ImportFaturamentoDialog
        open={importFaturamentoOpen}
        onClose={() => setImportFaturamentoOpen(false)}
      />

      {/* Dialogs de Despesas */}
      <NewDespesaDialog 
        open={newDespesaOpen}
        onClose={() => setNewDespesaOpen(false)}
      />

      <DespesaDetailsDialog 
        despesaId={selectedDespesaId}
        open={!!selectedDespesaId}
        onClose={() => setSelectedDespesaId(null)}
      />

      <ImportDespesasDialog
        open={importDespesasOpen}
        onClose={() => setImportDespesasOpen(false)}
      />
    </div>
  );
}
