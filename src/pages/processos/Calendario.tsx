import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useProcessoPrazos, useTogglePrazoCumprido } from "@/hooks/useProcessoPrazos";
import { ProcessoPrazo, TIPO_PRAZO_LABELS } from "@/types/processos";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function ProcessosCalendario() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [month, setMonth] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

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

  // Filtrar os 5 processos mais urgentes (≤ 3 dias)
  const prazosUrgentes = useMemo(() => {
    return prazos
      .filter(p => p.status === 'pendente' && (p.dias_restantes ?? 999) <= 3)
      .sort((a, b) => (a.dias_restantes ?? 999) - (b.dias_restantes ?? 999))
      .slice(0, 5);
  }, [prazos]);

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

  const getStatusBadge = (status: string) => {
    if (status === "cumprido") {
      return <Badge className="bg-green-100 text-green-900 hover:bg-green-200">Cumprido</Badge>;
    }
    if (status === "vencido") {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendário de Processos</h1>
        <p className="text-muted-foreground mt-2">
          Visualize os prazos em formato de calendário
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendário de Prazos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando prazos...</p>
            </div>
          ) : (
            <>
              <div className="w-full max-w-5xl mx-auto">
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
            </>
          )}
        </CardContent>
      </Card>

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
                          {prazo.tipo_prazo === "recurso" && "Recurso"}
                          {prazo.tipo_prazo === "contestacao" && "Contestação"}
                          {prazo.tipo_prazo === "audiencia" && "Audiência"}
                          {prazo.tipo_prazo === "outro" && "Outro"}
                        </h4>
                        <p className="text-sm text-muted-foreground">{prazo.descricao}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(prazo.status)}
                          {getPrioridadeBadge(prazo.prioridade)}
                        </div>

                        <p className="text-sm font-medium">
                          {getDiasRestantesTexto(prazo)}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Processo ID: {prazo.processo_id.substring(0, 8)}...
                        </p>
                      </div>

                      {prazo.status === "pendente" && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={false}
                            onCheckedChange={() => handleToggleCumprido(prazo)}
                          />
                          <span className="text-sm">Marcar como cumprido</span>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = `/dashboard/processos?id=${prazo.processo_id}`;
                      }}
                    >
                      Ver Processo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Tabela de Processos Urgentes */}
      <Card>
        <CardHeader>
          <CardTitle>
            Processos com Prazos Urgentes
          </CardTitle>
          <CardDescription>
            Top 5 processos com prazos vencendo nos próximos 3 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : prazosUrgentes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum prazo urgente no momento
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Processo</TableHead>
                    <TableHead>Tipo Prazo</TableHead>
                    <TableHead>Data Limite</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prazosUrgentes.map((prazo) => {
                    const diasRestantes = prazo.dias_restantes ?? 0;
                    const isVenceHoje = diasRestantes === 0;
                    
                    return (
                      <TableRow 
                        key={prazo.id}
                        className={isVenceHoje ? "bg-red-50 dark:bg-red-950/10" : ""}
                      >
                        <TableCell className="font-mono text-sm font-medium">
                          {(prazo as any).processo?.numero_processo || "Sem número"}
                        </TableCell>
                        
                        <TableCell>
                          {TIPO_PRAZO_LABELS[prazo.tipo_prazo]}
                        </TableCell>
                        
                        <TableCell>
                          {format(new Date(prazo.data_prazo), "dd/MM/yyyy")}
                        </TableCell>
                        
                        <TableCell>
                          <span className={cn(
                            "font-medium",
                            isVenceHoje && "text-red-600",
                            diasRestantes === 1 && "text-orange-600",
                            diasRestantes > 1 && "text-yellow-600"
                          )}>
                            {getDiasRestantesTexto(prazo)}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          {getPrioridadeBadge(prazo.prioridade)}
                        </TableCell>
                        
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigate(`/dashboard/processos?id=${prazo.processo_id}`);
                            }}
                          >
                            Ver Processo
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
