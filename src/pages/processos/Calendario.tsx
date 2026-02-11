import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useProcessoPrazos, useTogglePrazoCumprido } from "@/hooks/useProcessoPrazos";
import { useDemandas } from "@/hooks/useDemandas";
import { useRotinasCalendario, useToggleRotinaStatus, useDeleteRotina } from "@/hooks/useRotinasCalendario";
import { ProcessoPrazo, TIPO_PRAZO_LABELS } from "@/types/processos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, AlertTriangle, Clock, Plus, ListTodo, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddRotinaDialog from "@/components/processos/AddRotinaDialog";

type FilterStatus = "todos" | "pendentes" | "cumpridos" | "vencidos";
type FilterTipo = "todos" | "prazos" | "tarefas" | "rotinas";

interface CalendarioItem {
  id: string;
  tipo: "prazo" | "tarefa" | "rotina";
  titulo: string;
  subtitulo?: string;
  data: string;
  status: string;
  prioridade?: string;
  diasRestantes?: number;
  alertaAtivo?: boolean;
  original: any;
}

export default function ProcessosCalendario() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [month, setMonth] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<FilterStatus>("todos");
  const [filtroTipo, setFiltroTipo] = useState<FilterTipo>("todos");
  const [addRotinaOpen, setAddRotinaOpen] = useState(false);

  const { data: prazos = [], isLoading: loadingPrazos } = useProcessoPrazos();
  const { data: demandas = [], isLoading: loadingDemandas } = useDemandas();
  const { data: rotinas = [], isLoading: loadingRotinas } = useRotinasCalendario();
  const toggleCumprido = useTogglePrazoCumprido();
  const toggleRotina = useToggleRotinaStatus();
  const deleteRotina = useDeleteRotina();

  const isLoading = loadingPrazos || loadingDemandas || loadingRotinas;

  // Unify all items
  const todosItens = useMemo<CalendarioItem[]>(() => {
    const items: CalendarioItem[] = [];

    prazos.forEach((p) => {
      items.push({
        id: p.id,
        tipo: "prazo",
        titulo: p.descricao,
        subtitulo: TIPO_PRAZO_LABELS[p.tipo_prazo] || p.tipo_prazo,
        data: p.data_prazo,
        status: p.status,
        prioridade: p.prioridade,
        diasRestantes: p.dias_restantes,
        alertaAtivo: p.alerta_ativo,
        original: p,
      });
    });

    demandas.forEach((d: any) => {
      if (!d.data_limite) return;
      const dateLimite = new Date(d.data_limite);
      const hoje = new Date();
      const dias = Math.ceil((dateLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      items.push({
        id: d.id,
        tipo: "tarefa",
        titulo: d.titulo,
        subtitulo: d.tipo,
        data: d.data_limite,
        status: d.status === "concluida" ? "cumprido" : "pendente",
        prioridade: d.prioridade,
        diasRestantes: dias,
        original: d,
      });
    });

    rotinas.forEach((r) => {
      items.push({
        id: r.id,
        tipo: "rotina",
        titulo: r.titulo,
        subtitulo: r.tipo,
        data: r.data,
        status: r.status,
        prioridade: r.prioridade,
        original: r,
      });
    });

    return items.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [prazos, demandas, rotinas]);

  // Group by date
  const itensPorData = useMemo(() => {
    const mapa = new Map<string, CalendarioItem[]>();
    todosItens.forEach((item) => {
      const key = format(new Date(item.data), "yyyy-MM-dd");
      const existing = mapa.get(key) || [];
      mapa.set(key, [...existing, item]);
    });
    return mapa;
  }, [todosItens]);

  // Classify dates for calendar modifiers
  const { diasUrgentes, diasAlerta, diasNormais, diasCumpridos, diasTarefa, diasRotina } = useMemo(() => {
    const urgentes: Date[] = [];
    const alerta: Date[] = [];
    const normais: Date[] = [];
    const cumpridos: Date[] = [];
    const tarefa: Date[] = [];
    const rotina: Date[] = [];

    itensPorData.forEach((items, dateKey) => {
      const date = new Date(dateKey);
      const hasPrazo = items.some((i) => i.tipo === "prazo");
      const hasTarefa = items.some((i) => i.tipo === "tarefa");
      const hasRotina = items.some((i) => i.tipo === "rotina");
      const todosCumpridos = items.every((i) => i.status === "cumprido" || i.status === "concluido");

      if (todosCumpridos) {
        cumpridos.push(date);
      } else if (hasPrazo) {
        const pendentes = items.filter((i) => i.tipo === "prazo" && i.status === "pendente");
        const menorDias = pendentes.length > 0 ? Math.min(...pendentes.map((i) => i.diasRestantes ?? 999)) : 999;
        if (menorDias <= 3) urgentes.push(date);
        else if (menorDias <= 7) alerta.push(date);
        else normais.push(date);
      } else if (hasTarefa) {
        tarefa.push(date);
      } else if (hasRotina) {
        rotina.push(date);
      }
    });

    return { diasUrgentes: urgentes, diasAlerta: alerta, diasNormais: normais, diasCumpridos: cumpridos, diasTarefa: tarefa, diasRotina: rotina };
  }, [itensPorData]);

  // Filtered items for list
  const itensFiltrados = useMemo(() => {
    return todosItens.filter((item) => {
      if (filtroTipo !== "todos" && item.tipo !== filtroTipo.slice(0, -1)) return false;
      const dias = item.diasRestantes ?? 0;
      const isVencido = item.status === "pendente" && dias < 0;
      switch (filtroStatus) {
        case "pendentes": return item.status === "pendente" && dias >= 0;
        case "cumpridos": return item.status === "cumprido" || item.status === "concluido";
        case "vencidos": return isVencido;
        default: return true;
      }
    });
  }, [todosItens, filtroStatus, filtroTipo]);

  const itensDoDialog = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return itensPorData.get(key) || [];
  }, [selectedDate, itensPorData]);

  const handleDayClick = (date: Date | undefined) => {
    if (!date) return;
    const key = format(date, "yyyy-MM-dd");
    if (itensPorData.has(key)) {
      setSelectedDate(date);
      setDialogOpen(true);
    }
  };

  const handleToggle = (item: CalendarioItem) => {
    if (item.tipo === "prazo") {
      toggleCumprido.mutate({ id: item.id, cumprido: item.status !== "cumprido" });
    } else if (item.tipo === "rotina") {
      toggleRotina.mutate({ id: item.id, concluido: item.status !== "concluido" });
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "prazo": return <Badge className="bg-blue-100 text-blue-900 hover:bg-blue-200">Prazo</Badge>;
      case "tarefa": return <Badge className="bg-purple-100 text-purple-900 hover:bg-purple-200">Tarefa</Badge>;
      case "rotina": return <Badge className="bg-gray-100 text-gray-900 hover:bg-gray-200">Rotina</Badge>;
    }
  };

  const getStatusBadge = (item: CalendarioItem) => {
    if (item.status === "cumprido" || item.status === "concluido") {
      return <Badge className="bg-green-100 text-green-900 hover:bg-green-200">Cumprido</Badge>;
    }
    if (item.status === "pendente" && (item.diasRestantes ?? 0) < 0) {
      return <Badge className="bg-red-100 text-red-900 hover:bg-red-200">Vencido</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-900 hover:bg-blue-200">Pendente</Badge>;
  };

  const getDiasTexto = (item: CalendarioItem) => {
    if (item.status === "cumprido" || item.status === "concluido") return "Cumprido";
    const dias = item.diasRestantes ?? 0;
    if (dias < 0) return `Vencido há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"}`;
    if (dias === 0) return "Vence hoje";
    return `Faltam ${dias} ${dias === 1 ? "dia" : "dias"}`;
  };

  const getUrgenciaColor = (item: CalendarioItem) => {
    if (item.tipo === "rotina") return "border-l-4 border-l-gray-400";
    if (item.tipo === "tarefa") return "border-l-4 border-l-purple-400";
    const dias = item.diasRestantes;
    if (dias === undefined) return "";
    if (dias < 0) return "border-l-4 border-l-red-500";
    if (dias <= 3) return "border-l-4 border-l-red-400";
    if (dias <= 7) return "border-l-4 border-l-yellow-400";
    return "border-l-4 border-l-blue-300";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendário e Prazos</h1>
          <p className="text-muted-foreground mt-2">Visualize prazos, tarefas e rotinas em um só lugar</p>
        </div>
        <Button onClick={() => setAddRotinaOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar Rotina
        </Button>
      </div>

      {/* Filtro por tipo */}
      <Tabs value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as FilterTipo)}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="prazos">Prazos</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="rotinas">Rotinas</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-6">
          <Card><CardContent className="p-6"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Calendário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5" /> Calendário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="w-full">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDayClick}
                  month={month}
                  onMonthChange={setMonth}
                  className="rounded-md border w-full p-4"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                    month: "space-y-4 w-full",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-lg font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md font-normal text-sm flex-1 p-2",
                    row: "flex w-full mt-2",
                    cell: "relative p-0 text-center focus-within:relative focus-within:z-20 flex-1 h-14",
                    day: "h-14 w-full p-0 font-normal aria-selected:opacity-100 text-base hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground font-semibold",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                  }}
                  modifiers={{
                    urgente: diasUrgentes,
                    alerta: diasAlerta,
                    normal: diasNormais,
                    cumprido: diasCumpridos,
                    tarefa: diasTarefa,
                    rotina: diasRotina,
                  }}
                  modifiersClassNames={{
                    urgente: "bg-red-100 text-red-900 font-bold hover:bg-red-200",
                    alerta: "bg-yellow-100 text-yellow-900 font-semibold hover:bg-yellow-200",
                    normal: "bg-blue-50 text-blue-900 hover:bg-blue-100",
                    cumprido: "bg-green-50 text-green-900 hover:bg-green-100",
                    tarefa: "bg-purple-50 text-purple-900 hover:bg-purple-100",
                    rotina: "bg-gray-100 text-gray-700 hover:bg-gray-200",
                  }}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Legenda:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-100 border border-red-200" /><span className="text-sm">Urgente (≤3d)</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200" /><span className="text-sm">Alerta (≤7d)</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" /><span className="text-sm">Normal</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-50 border border-green-200" /><span className="text-sm">Cumprido</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-50 border border-purple-200" /><span className="text-sm">Tarefa</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" /><span className="text-sm">Rotina</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Lista de Itens</CardTitle>
                  <CardDescription>{itensFiltrados.length} {itensFiltrados.length === 1 ? "item" : "itens"}</CardDescription>
                </div>
                <Tabs value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as FilterStatus)}>
                  <TabsList>
                    <TabsTrigger value="todos">Todos</TabsTrigger>
                    <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                    <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
                    <TabsTrigger value="cumpridos">Cumpridos</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {itensFiltrados.length === 0 ? (
                <div className="text-center py-8"><p className="text-muted-foreground text-sm">Nenhum item encontrado</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {itensFiltrados.map((item) => (
                    <Card
                      key={`${item.tipo}-${item.id}`}
                      className={cn(
                        "hover:shadow-md transition-shadow cursor-pointer",
                        getUrgenciaColor(item),
                        (item.status === "cumprido" || item.status === "concluido") && "opacity-60"
                      )}
                      onClick={() => { setSelectedDate(new Date(item.data)); setDialogOpen(true); }}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.titulo}</p>
                            <p className="text-xs text-muted-foreground">{item.subtitulo}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {getTipoBadge(item.tipo)}
                            {item.tipo !== "tarefa" && (
                              <Checkbox
                                checked={item.status === "cumprido" || item.status === "concluido"}
                                onCheckedChange={() => handleToggle(item)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(item.data), "dd/MM/yyyy")}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn(
                            "text-xs font-medium",
                            (item.diasRestantes ?? 0) < 0 && "text-red-600",
                            item.diasRestantes === 0 && "text-red-600",
                            (item.diasRestantes ?? 0) > 0 && (item.diasRestantes ?? 0) <= 3 && "text-orange-600",
                            (item.diasRestantes ?? 0) > 3 && "text-muted-foreground"
                          )}>
                            {getDiasTexto(item)}
                          </span>
                          {item.alertaAtivo && item.status === "pendente" && (
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog de Detalhes do Dia */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {itensDoDialog.length} {itensDoDialog.length === 1 ? "item" : "itens"} neste dia
            </p>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {/* Prazos */}
              {itensDoDialog.filter((i) => i.tipo === "prazo").length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-blue-600" /> Prazos Processuais</h3>
                  <div className="space-y-2">
                    {itensDoDialog.filter((i) => i.tipo === "prazo").map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <p className="font-medium text-sm">{item.titulo}</p>
                            <p className="text-xs text-muted-foreground">{item.subtitulo}</p>
                            <div className="flex gap-2">{getStatusBadge(item)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={item.status === "cumprido"}
                              onCheckedChange={() => handleToggle(item)}
                            />
                            <span className="text-xs">Cumprido</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {/* Tarefas */}
              {itensDoDialog.filter((i) => i.tipo === "tarefa").length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><ListTodo className="h-4 w-4 text-purple-600" /> Tarefas</h3>
                  <div className="space-y-2">
                    {itensDoDialog.filter((i) => i.tipo === "tarefa").map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <p className="font-medium text-sm">{item.titulo}</p>
                          <p className="text-xs text-muted-foreground">{item.subtitulo} • {getDiasTexto(item)}</p>
                          <div className="flex gap-2 mt-1">{getStatusBadge(item)}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {/* Rotinas */}
              {itensDoDialog.filter((i) => i.tipo === "rotina").length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><RotateCcw className="h-4 w-4 text-gray-600" /> Rotinas</h3>
                  <div className="space-y-2">
                    {itensDoDialog.filter((i) => i.tipo === "rotina").map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <p className="font-medium text-sm">{item.titulo}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.subtitulo}
                              {item.original.horario && ` • ${item.original.horario}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={item.status === "concluido"}
                              onCheckedChange={() => handleToggle(item)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={(e) => { e.stopPropagation(); deleteRotina.mutate(item.id); }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AddRotinaDialog open={addRotinaOpen} onOpenChange={setAddRotinaOpen} />
    </div>
  );
}
