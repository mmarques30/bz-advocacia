import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Upload, History, ChevronDown, Trash2, AlertTriangle, Target } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnosDisponiveis, useClearTransacoes } from "@/hooks/useTransacoesFinanceiras";
import { useCheckIsAdmin } from "@/hooks/useUsuarios";

// Visão Geral
import { VisaoGeralTab } from "@/components/financeiro/visao-geral/VisaoGeralTab";

// Faturamento
import { FaturamentoTable } from "@/components/financeiro/FaturamentoTable";
import { NewEntradaFaturamentoDialog } from "@/components/financeiro/NewEntradaFaturamentoDialog";
import { AcordoDetailsDialog } from "@/components/financeiro/AcordoDetailsDialog";
import { RegistrarPagamentoDialog } from "@/components/financeiro/RegistrarPagamentoDialog";
import { FaturamentoKPIs } from "@/components/financeiro/FaturamentoKPIs";
import { FaturamentoCharts } from "@/components/financeiro/FaturamentoCharts";
import { FaturamentoFilters, getDefaultFaturamentoFilters, type FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";
import { ImportFaturamentoDialog } from "@/components/financeiro/ImportFaturamentoDialog";
import { ConfigurarMetaDialog } from "@/components/dashboard/ConfigurarMetaDialog";

// Despesas
import { DespesasTable } from "@/components/financeiro/despesas/DespesasTable";
import { NewDespesaDialog } from "@/components/financeiro/despesas/NewDespesaDialog";
import { DespesaDetailsDialog } from "@/components/financeiro/despesas/DespesaDetailsDialog";
import { DespesasAlerts } from "@/components/financeiro/DespesasAlerts";
import { DespesasKPIs } from "@/components/financeiro/DespesasKPIs";
import { DespesasGlobalFilters, getDefaultDespesasGlobalFilters, type DespesasGlobalFiltersState } from "@/components/financeiro/DespesasGlobalFilters";
import type { Despesa } from "@/types/financeiro";
import { ImportDespesasDialog } from "@/components/financeiro/despesas/ImportDespesasDialog";
import { DespesasProjecaoTab } from "@/components/financeiro/DespesasProjecaoTab";

// Acordos
import { AcordosParcelasTab } from "@/components/financeiro/acordos/AcordosParcelasTab";

// Distribuição
import { DistribuicaoSociasTab } from "@/components/financeiro/distribuicao/DistribuicaoSociasTab";

// Histórico
import { HistoricoFilters, getDefaultHistoricoFilters, type HistoricoFiltersState } from "@/components/financeiro/historico/HistoricoFilters";
import { HistoricoTable } from "@/components/financeiro/historico/HistoricoTable";

const currentYear = new Date().getFullYear();

const MESES = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export default function Financeiro() {
  const [anoSelecionado, setAnoSelecionado] = useState<string>(String(currentYear));
  // Mês da aba Visão Geral — fica ao lado do seletor de ano no header.
  const [mesSelecionado, setMesSelecionado] = useState<string>(String(new Date().getMonth() + 1));
  const [activeTab, setActiveTab] = useState<string>("visao-geral");
  // Sub-aba do Faturamento (Acordos foi trazido pra ca como sub-aba).
  const [faturamentoSubTab, setFaturamentoSubTab] = useState<string>("lancamentos");

  // Faturamento state
  const [newEntradaOpen, setNewEntradaOpen] = useState(false);
  const [selectedAcordoId, setSelectedAcordoId] = useState<string | null>(null);
  const [pagamentoParcelaId, setPagamentoParcelaId] = useState<string | null>(null);
  const [faturamentoFilters, setFaturamentoFilters] = useState<FaturamentoFiltersState>(getDefaultFaturamentoFilters());
  const [importFaturamentoOpen, setImportFaturamentoOpen] = useState(false);

  // Despesas state
  const [newDespesaOpen, setNewDespesaOpen] = useState(false);
  const [selectedDespesaId, setSelectedDespesaId] = useState<string | null>(null);
  const [despesaParaDuplicar, setDespesaParaDuplicar] = useState<Despesa | null>(null);
  const [despesasGlobalFilters, setDespesasGlobalFilters] = useState<DespesasGlobalFiltersState>(getDefaultDespesasGlobalFilters());
  const [importDespesasOpen, setImportDespesasOpen] = useState(false);

  // Histórico state
  const [historicoFilters, setHistoricoFilters] = useState<HistoricoFiltersState>(getDefaultHistoricoFilters());

  // Admin
  const [clearDataOpen, setClearDataOpen] = useState(false);
  // Botao "Limpar transacoes" apaga TUDO de transacoes_financeiras. Pra
  // evitar clique acidental (ja aconteceu uma vez de lancamentos do mes
  // sumirem), o admin precisa digitar "LIMPAR" antes de confirmar.
  const [clearConfirmText, setClearConfirmText] = useState("");
  const clearTransacoes = useClearTransacoes();
  const { data: isAdmin } = useCheckIsAdmin();
  const { data: anosDisponiveis } = useAnosDisponiveis();
  const anoCorrente = new Date().getFullYear();
  const anosParaSelect = (() => {
    const set = new Set<number>(anosDisponiveis ?? []);
    set.add(anoCorrente);
    return Array.from(set).sort((a, b) => b - a);
  })();

  const anoNumero = anoSelecionado === "todos" ? null : Number(anoSelecionado);
  const mesVisaoGeralNumero = mesSelecionado === "todos" ? null : Number(mesSelecionado);

  // Filtro de mes do Faturamento: deriva o mes selecionado quando o periodo
  // cobre exatamente um mes, e permite clicar numa barra do grafico pra
  // filtrar (ou clicar de novo no mesmo mes pra limpar). Cards, grafico e
  // tabela compartilham faturamentoFilters, entao tudo se ajusta junto.
  const mesKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const faturamentoSelectedMes = (() => {
    const r = faturamentoFilters.dateRange;
    if (r?.from && r?.to && mesKey(r.from) === mesKey(r.to)) return mesKey(r.from);
    return null;
  })();
  const handleSelectFaturamentoMes = (mes: string) => {
    if (faturamentoSelectedMes === mes) {
      setFaturamentoFilters({ ...faturamentoFilters, dateRange: undefined });
      return;
    }
    const [y, m] = mes.split("-").map(Number);
    setFaturamentoFilters({
      ...faturamentoFilters,
      dateRange: {
        from: new Date(y, m - 1, 1),
        to: new Date(y, m, 0, 23, 59, 59, 999),
      },
    });
  };

  // Quando o usuário não definiu um período manual no filtro do Faturamento,
  // aplicamos automaticamente o ano selecionado no topo (01/jan a 31/dez).
  // Isso garante que ao escolher 2026 a aba Faturamento mostre só 2026,
  // em vez de somar receitas de todos os anos.
  const effectiveFaturamentoFilters: FaturamentoFiltersState = (() => {
    if (faturamentoFilters.dateRange?.from || faturamentoFilters.dateRange?.to) {
      return faturamentoFilters;
    }
    if (anoNumero === null) return faturamentoFilters;
    return {
      ...faturamentoFilters,
      dateRange: {
        from: new Date(anoNumero, 0, 1),
        to: new Date(anoNumero, 11, 31, 23, 59, 59, 999),
      },
    };
  })();



  // Mesmo padrao do Faturamento: o grafico de Projecao (sempre 12 meses)
  // funciona como navegador — clicar num mes filtra cards e tabela.
  const despesasSelectedMes = (() => {
    const r = despesasGlobalFilters.dateRange;
    if (r?.from && r?.to && mesKey(r.from) === mesKey(r.to)) return mesKey(r.from);
    return null;
  })();

  // Igual ao Faturamento: quando não há período custom, o ano do header
  // define o intervalo das despesas (evita ter dois seletores de ano).
  const effectiveDespesasFilters: DespesasGlobalFiltersState = (() => {
    if (despesasGlobalFilters.dateRange?.from || despesasGlobalFilters.dateRange?.to) {
      return despesasGlobalFilters;
    }
    if (anoNumero === null) return despesasGlobalFilters;
    return {
      ...despesasGlobalFilters,
      dateRange: {
        from: new Date(anoNumero, 0, 1),
        to: new Date(anoNumero, 11, 31, 23, 59, 59, 999),
      },
    };
  })();
  const handleSelectDespesaMes = (mes: string) => {
    if (despesasSelectedMes === mes) {
      setDespesasGlobalFilters({ ...despesasGlobalFilters, dateRange: undefined });
      return;
    }
    const [y, m] = mes.split("-").map(Number);
    setDespesasGlobalFilters({
      ...despesasGlobalFilters,
      dateRange: {
        from: new Date(y, m - 1, 1),
        to: new Date(y, m, 0, 23, 59, 59, 999),
      },
    });
  };

  const handleClearData = () => {
    if (clearConfirmText !== "LIMPAR") return;
    clearTransacoes.mutate();
    setClearDataOpen(false);
    setClearConfirmText("");
  };

  return (
    <div className="space-y-6">
      {/* Header com seletor de ano */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-seasons text-primary">Gestão Financeira</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "visao-geral" && (
            <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os meses</SelectItem>
                {MESES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {activeTab !== "historico" && (
            <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anosParaSelect.map((ano) => (
                  <SelectItem key={ano} value={String(ano)}>
                    {ano}
                  </SelectItem>
                ))}
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          )}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setClearDataOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Limpar transações
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={clearDataOpen} onOpenChange={(open) => {
        setClearDataOpen(open);
        if (!open) setClearConfirmText("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Limpar tabela de transações?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação apaga <strong>todos</strong> os registros da tabela <strong>transacoes_financeiras</strong> (todos os anos).
              Não apaga despesas, acordos, parcelas, créditos condicionais nem metas — essas tabelas têm
              seus próprios fluxos de exclusão. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              Pra confirmar, digite <strong>LIMPAR</strong> abaixo:
            </p>
            <input
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive"
              placeholder="LIMPAR"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              onClick={handleClearData}
              disabled={clearConfirmText !== "LIMPAR"}
            >
              Sim, limpar transações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 5 Abas (Acordos virou sub-aba do Faturamento) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="distribuicao">Distribuição Sócias</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="visao-geral">
          <VisaoGeralTab
            ano={anoNumero}
            mes={mesVisaoGeralNumero}
            onNavigateToAcordos={() => {
              setActiveTab("faturamento");
              setFaturamentoSubTab("acordos");
            }}
          />
        </TabsContent>

        {/* Aba Faturamento (Lançamentos+Projeção unificados, Acordos como sub-aba) */}
        <TabsContent value="faturamento" className="space-y-6">
          <Tabs value={faturamentoSubTab} onValueChange={setFaturamentoSubTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
              <TabsTrigger value="acordos">Acordos e Parcelas</TabsTrigger>
            </TabsList>

            <TabsContent value="lancamentos" className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <FaturamentoFilters filters={faturamentoFilters} onChange={setFaturamentoFilters} />
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <ConfigurarMetaDialog
                    trigger={
                      <Button variant="outline" size="sm">
                        <Target className="h-4 w-4 mr-2" />
                        Meta
                      </Button>
                    }
                  />
                  <Button variant="outline" size="sm" onClick={() => setImportFaturamentoOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                  <Button size="sm" onClick={() => setNewEntradaOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Entrada
                  </Button>
                </div>
              </div>
              <FaturamentoKPIs filters={effectiveFaturamentoFilters} />
              <FaturamentoCharts
                filters={effectiveFaturamentoFilters}
                selectedMes={faturamentoSelectedMes}
                onSelectMonth={handleSelectFaturamentoMes}
              />
              <FaturamentoTable filters={effectiveFaturamentoFilters} onOpenAcordo={setSelectedAcordoId} />

            </TabsContent>

            <TabsContent value="acordos" className="space-y-6">
              <AcordosParcelasTab />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Aba Despesas (Lançamentos+Projeção unificados numa tela só) */}
        <TabsContent value="despesas" className="space-y-6">
          <DespesasAlerts />
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <DespesasGlobalFilters filters={despesasGlobalFilters} onChange={setDespesasGlobalFilters} />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setImportDespesasOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button size="sm" onClick={() => setNewDespesaOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Despesa
              </Button>
            </div>
          </div>
          <DespesasKPIs filters={effectiveDespesasFilters} />
          <DespesasProjecaoTab
            selectedMes={despesasSelectedMes}
            onSelectMonth={handleSelectDespesaMes}
            dateRange={effectiveDespesasFilters.dateRange}
          />
          <DespesasTable
            filters={{
              categoria: effectiveDespesasFilters.categoria !== "todos" ? [effectiveDespesasFilters.categoria as any] : undefined,
              status: effectiveDespesasFilters.status !== "todos" ? [effectiveDespesasFilters.status as any] : undefined,
              // Propaga periodo (antes o filtro global "período" so afetava KPIs/charts e a
              // tabela ignorava, fazendo parecer que o filtro "nao funcionava").
              data_inicio: effectiveDespesasFilters.dateRange?.from,
              data_fim: effectiveDespesasFilters.dateRange?.to,
            }}
            onSelectDespesa={setSelectedDespesaId}
            onDuplicateDespesa={(d) => {
              setDespesaParaDuplicar(d);
              setNewDespesaOpen(true);
            }}
          />
        </TabsContent>

        {/* Aba Distribuição Sócias */}
        <TabsContent value="distribuicao">
          <DistribuicaoSociasTab ano={anoNumero} />
        </TabsContent>

        {/* Aba Histórico */}
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

      {/* Dialogs */}
      <NewEntradaFaturamentoDialog open={newEntradaOpen} onClose={() => setNewEntradaOpen(false)} />
      <AcordoDetailsDialog acordoId={selectedAcordoId} open={!!selectedAcordoId} onClose={() => setSelectedAcordoId(null)} onRegistrarPagamento={setPagamentoParcelaId} />
      <RegistrarPagamentoDialog parcelaId={pagamentoParcelaId} open={!!pagamentoParcelaId} onClose={() => setPagamentoParcelaId(null)} />
      <ImportFaturamentoDialog open={importFaturamentoOpen} onClose={() => setImportFaturamentoOpen(false)} onSuccess={() => {}} />
      <NewDespesaDialog
        open={newDespesaOpen}
        onClose={() => {
          setNewDespesaOpen(false);
          setDespesaParaDuplicar(null);
        }}
        initialData={despesaParaDuplicar}
      />
      <DespesaDetailsDialog despesaId={selectedDespesaId} open={!!selectedDespesaId} onClose={() => setSelectedDespesaId(null)} />
      <ImportDespesasDialog open={importDespesasOpen} onClose={() => setImportDespesasOpen(false)} onSuccess={() => {}} />
    </div>
  );
}
