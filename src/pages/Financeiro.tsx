import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Upload, History, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DespesasAlerts } from "@/components/financeiro/DespesasAlerts";
import { AcordosTable } from "@/components/financeiro/AcordosTable";
import { FaturamentoTable } from "@/components/financeiro/FaturamentoTable";
import { NewEntradaFaturamentoDialog } from "@/components/financeiro/NewEntradaFaturamentoDialog";
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
import { HistoricoFilters, getDefaultHistoricoFilters, type HistoricoFiltersState } from "@/components/financeiro/historico/HistoricoFilters";
import { HistoricoTable } from "@/components/financeiro/historico/HistoricoTable";
import type { AcordosFilters } from "@/types/financeiro";
import type { TransacoesFilters as TFilters } from "@/types/transacoes";

export default function Financeiro() {
  const [newEntradaOpen, setNewEntradaOpen] = useState(false);
  const [selectedAcordoId, setSelectedAcordoId] = useState<string | null>(null);
  const [pagamentoParcelaId, setPagamentoParcelaId] = useState<string | null>(null);
  
  // Estados para despesas
  const [newDespesaOpen, setNewDespesaOpen] = useState(false);
  const [selectedDespesaId, setSelectedDespesaId] = useState<string | null>(null);

  // Estados para transações (Visão Geral) - SEM FILTRO PADRÃO
  const [transacoesFilters, setTransacoesFilters] = useState<TFilters>({});

  // Estados para filtros globais e dialogs de importação
  const [faturamentoFilters, setFaturamentoFilters] = useState<FaturamentoFiltersState>(getDefaultFaturamentoFilters());
  const [importFaturamentoOpen, setImportFaturamentoOpen] = useState(false);
  
  const [despesasGlobalFilters, setDespesasGlobalFilters] = useState<DespesasGlobalFiltersState>(getDefaultDespesasGlobalFilters());
  const [importDespesasOpen, setImportDespesasOpen] = useState(false);

  // Estados para Histórico
  const [historicoFilters, setHistoricoFilters] = useState<HistoricoFiltersState>(getDefaultHistoricoFilters());

  // Converter filtros globais para filtros de tabela
  const acordosFiltersFromGlobal: AcordosFilters = {
    search: faturamentoFilters.cliente !== "todos" ? faturamentoFilters.cliente : undefined,
    status: faturamentoFilters.status !== "todos" ? [faturamentoFilters.status as any] : undefined,
    tipo_servico: faturamentoFilters.tipoServico !== "todos" ? faturamentoFilters.tipoServico : undefined,
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
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="geral" className="space-y-6">
          <TransacoesFilters filters={transacoesFilters} onFiltersChange={setTransacoesFilters} />
          <TransacoesKPIs filters={transacoesFilters} />
          <TransacoesCharts filters={transacoesFilters} />
          <TransacoesTable filters={transacoesFilters} />
        </TabsContent>

        {/* Aba Faturamento - Acordos e Receitas */}
        <TabsContent value="faturamento" className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <FaturamentoFilters filters={faturamentoFilters} onChange={setFaturamentoFilters} />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" onClick={() => setImportFaturamentoOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button onClick={() => setNewEntradaOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Entrada
              </Button>
            </div>
          </div>
          
          <FaturamentoKPIs filters={faturamentoFilters} />
          <FaturamentoCharts filters={faturamentoFilters} />
          <FaturamentoWidgets onRegistrarPagamento={setPagamentoParcelaId} filters={faturamentoFilters} />
          
          <FaturamentoTable filters={faturamentoFilters} />
        </TabsContent>

        {/* Aba Despesas */}
        <TabsContent value="despesas" className="space-y-6">
          <DespesasAlerts />
          
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <DespesasGlobalFilters filters={despesasGlobalFilters} onChange={setDespesasGlobalFilters} />
            </div>
            <div className="flex gap-2 shrink-0">
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
          
          <DespesasKPIs filters={despesasGlobalFilters} />
          
          <div className="grid gap-6 md:grid-cols-2">
            <DespesasCharts filters={despesasGlobalFilters} />
            <DespesasWidgets filters={despesasGlobalFilters} />
          </div>
          
          <DespesasTable 
            filters={{
              categoria: despesasGlobalFilters.categoria !== "todos" ? [despesasGlobalFilters.categoria as any] : undefined,
              status: despesasGlobalFilters.status !== "todos" ? [despesasGlobalFilters.status as any] : undefined,
            }}
            onSelectDespesa={setSelectedDespesaId}
          />
        </TabsContent>

        {/* Aba Histórico - Todas as transações importadas */}
        <TabsContent value="historico" className="space-y-6">
          <HistoricoFilters filters={historicoFilters} onChange={setHistoricoFilters} />
          
          <Collapsible defaultOpen className="border rounded-lg">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                <span className="font-medium">Transações Recentes</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0">
              <HistoricoTable filters={historicoFilters} mode="preview" />
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>
      </Tabs>

      {/* Dialogs de Faturamento */}
      <NewEntradaFaturamentoDialog 
        open={newEntradaOpen}
        onClose={() => setNewEntradaOpen(false)}
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
        onSuccess={(ano) => {
          setTransacoesFilters(prev => ({ ...prev, ano, dataInicio: undefined, dataFim: undefined }));
          setHistoricoFilters(prev => ({ ...prev, ano }));
        }}
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
        onSuccess={(ano) => {
          setTransacoesFilters(prev => ({ ...prev, ano, dataInicio: undefined, dataFim: undefined }));
          setHistoricoFilters(prev => ({ ...prev, ano }));
        }}
      />
    </div>
  );
}
