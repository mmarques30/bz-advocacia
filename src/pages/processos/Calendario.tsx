import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProcessoPrazos, useTogglePrazoCumprido } from "@/hooks/useProcessoPrazos";
import { ProcessoPrazo, TIPO_PRAZO_LABELS } from "@/types/processos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type FilterStatus = "todos" | "pendentes" | "cumpridos" | "vencidos";

export default function ProcessosCalendario() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [month, setMonth] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<FilterStatus>("todos");

  const { data: prazos = [], isLoading } = useProcessoPrazos();
  const toggleCumprido = useTogglePrazoCumprido();

  // Agrupar prazos por data
  const prazosPorData = useMemo(() => {
    const mapa = new Map<string, ProcessoPrazo[]>();
    
    prazos.forEach((prazo) => {
      const dataKey = format(new Date(prazo.data_prazo), "yyyy-MM-dd");
      const existing = mapa.get(dataKey) || [];
      mapa.set(dataKey, [...existing, prazo]);
    });

    return mapa;
  }, [prazos]);

  // Filtrar prazos pela lista
  const prazosFiltrados = useMemo(() => {
    return prazos.filter(prazo => {
      const diasRestantes = prazo.dias_restantes ?? 0;
      const isVencido = prazo.status === 'pendente' && diasRestantes < 0;
      
      switch (filtroStatus) {
        case "pendentes":
          return prazo.status === 'pendente' && diasRestantes >= 0;
        case "cumpridos":
          return prazo.status === 'cumprido';
        case "vencidos":
          return isVencido;
        default:
          return true;
      }
    }).sort((a, b) => {
      // Ordenar por data (mais próximos primeiro)
      return new Date(a.data_prazo).getTime() - new Date(b.data_prazo).getTime();
    });
  }, [prazos, filtroStatus]);

  // Classificar datas por status
  const { diasUrgentes, diasAlerta, diasNormais, diasCumpridos } = useMemo(() => {
    const urgentes: Date[] = [];
    const alerta: Date[] = [];
    const normais: Date[] = [];
    const cumpridos: Date[] = [];

    prazosPorData.forEach((prazosData, dataKey) => {
      const data = new Date(dataKey);
      const temPendente = prazosData.some((p) => p.status === "pendente");
      const todosCumpridos = prazosData.every((p) => p.status === "cumprido");

      if (todosCumpridos) {
        cumpridos.push(data);
      } else if (temPendente) {
        const menorDiasRestantes = Math.min(
          ...prazosData
            .filter((p) => p.status === "pendente")
            .map((p) => p.dias_restantes || 999)
        );

        if (menorDiasRestantes <= 3) {
          urgentes.push(data);
        } else if (menorDiasRestantes <= 7) {
          alerta.push(data);
        } else {
          normais.push(data);
        }
      }
    });

    return {
      diasUrgentes: urgentes,
      diasAlerta: alerta,
      diasNormais: normais,
      diasCumpridos: cumpridos,
    };
  }, [prazosPorData]);

  const prazosDoDialoSelected = useMemo(() => {
    if (!selectedDate) return [];
    const dataKey = format(selectedDate, "yyyy-MM-dd");
    return prazosPorData.get(dataKey) || [];
  }, [selectedDate, prazosPorData]);

  const handleDayClick = (date: Date | undefined) => {
    if (!date) return;
    const dataKey = format(date, "yyyy-MM-dd");
    if (prazosPorData.has(dataKey)) {
      setSelectedDate(date);
      setDialogOpen(true);
    }
  };

  const handleToggleCumprido = (prazo: ProcessoPrazo) => {
    toggleCumprido.mutate({
      id: prazo.id,
      cumprido: prazo.status !== "cumprido",
    });
  };

  const getStatusBadge = (status: string, diasRestantes?: number) => {
    if (status === "cumprido") {
      return <Badge className="bg-green-100 text-green-900 hover:bg-green-200">Cumprido</Badge>;
    }
    if (status === "pendente" && diasRestantes !== undefined && diasRestantes < 0) {
      return <Badge className="bg-red-100 text-red-900 hover:bg-red-200">Vencido</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-900 hover:bg-blue-200">Pendente</Badge>;
  };

  const getPrioridadeBadge = (prioridade?: string) => {
    if (prioridade === "alta") {
      return <Badge className="bg-red-50 text-red-700 border-red-200">Alta</Badge>;
    }
    if (prioridade === "media") {
      return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Média</Badge>;
    }
    return <Badge className="bg-gray-50 text-gray-700 border-gray-200">Baixa</Badge>;
  };

  const getDiasRestantesTexto = (prazo: ProcessoPrazo) => {
    const dias = prazo.dias_restantes || 0;
    if (dias < 0) {
      return `Vencido há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"}`;
    }
    if (dias === 0) {
      return "Vence hoje";
    }
    return `Faltam ${dias} ${dias === 1 ? "dia" : "dias"}`;
  };

  const getUrgenciaColor = (diasRestantes?: number) => {
    if (diasRestantes === undefined) return "";
    if (diasRestantes < 0) return "border-l-4 border-l-red-500";
    if (diasRestantes <= 3) return "border-l-4 border-l-red-400";
    if (diasRestantes <= 7) return "border-l-4 border-l-yellow-400";
    return "border-l-4 border-l-blue-300";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendário e Prazos</h1>
        <p className="text-muted-foreground mt-2">
          Visualize e acompanhe todos os prazos processuais
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Calendário - Largura Total */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendário de Prazos
              </CardTitle>
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
                  }}
                  modifiersClassNames={{
                    urgente: "bg-red-100 text-red-900 font-bold hover:bg-red-200",
                    alerta: "bg-yellow-100 text-yellow-900 font-semibold hover:bg-yellow-200",
                    normal: "bg-blue-50 text-blue-900 hover:bg-blue-100",
                    cumprido: "bg-green-50 text-green-900 hover:bg-green-100",
                  }}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Legenda:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
                    <span className="text-sm">Urgente (≤ 3 dias)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200" />
                    <span className="text-sm">Alerta (≤ 7 dias)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" />
                    <span className="text-sm">Normal (&gt; 7 dias)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
                    <span className="text-sm">Cumprido</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Prazos - Abaixo do Calendário */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Lista de Prazos
                  </CardTitle>
                  <CardDescription>
                    {prazosFiltrados.length} {prazosFiltrados.length === 1 ? 'prazo' : 'prazos'}
                  </CardDescription>
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
              {prazosFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    Nenhum prazo encontrado
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {prazosFiltrados.map((prazo) => (
                    <Card 
                      key={prazo.id} 
                      className={cn(
                        "hover:shadow-md transition-shadow cursor-pointer",
                        getUrgenciaColor(prazo.dias_restantes),
                        prazo.status === 'cumprido' && "opacity-60"
                      )}
                      onClick={() => {
                        setSelectedDate(new Date(prazo.data_prazo));
                        setDialogOpen(true);
                      }}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {prazo.descricao}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {TIPO_PRAZO_LABELS[prazo.tipo_prazo] || prazo.tipo_prazo}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Checkbox
                              checked={prazo.status === "cumprido"}
                              onCheckedChange={() => handleToggleCumprido(prazo)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(prazo.data_prazo), "dd/MM/yyyy")}
                        </div>
                        
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn(
                            "text-xs font-medium",
                            (prazo.dias_restantes ?? 0) < 0 && "text-red-600",
                            prazo.dias_restantes === 0 && "text-red-600",
                            (prazo.dias_restantes ?? 0) > 0 && (prazo.dias_restantes ?? 0) <= 3 && "text-orange-600",
                            (prazo.dias_restantes ?? 0) > 3 && "text-muted-foreground"
                          )}>
                            {prazo.status === 'cumprido' ? 'Cumprido' : getDiasRestantesTexto(prazo)}
                          </span>
                          
                          {prazo.alerta_ativo && prazo.status !== 'cumprido' && (
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

      {/* Dialog de Detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {prazosDoDialoSelected.length} {prazosDoDialoSelected.length === 1 ? "prazo" : "prazos"} neste dia
            </p>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {prazosDoDialoSelected.map((prazo) => (
                <Card key={prazo.id}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <h4 className="font-semibold">
                          {TIPO_PRAZO_LABELS[prazo.tipo_prazo] || prazo.tipo_prazo}
                        </h4>
                        <p className="text-sm text-muted-foreground">{prazo.descricao}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(prazo.status, prazo.dias_restantes)}
                          {getPrioridadeBadge(prazo.prioridade)}
                        </div>

                        <p className="text-sm font-medium">
                          {prazo.status === 'cumprido' ? 'Prazo cumprido' : getDiasRestantesTexto(prazo)}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Processo ID: {prazo.processo_id.substring(0, 8)}...
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={prazo.status === "cumprido"}
                          onCheckedChange={() => handleToggleCumprido(prazo)}
                        />
                        <span className="text-sm">Cumprido</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
