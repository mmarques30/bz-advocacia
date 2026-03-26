import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DemandaCard } from "./DemandaCard";
import { Demanda } from "@/types/demandas";
import { useOpcoesSistema } from "@/hooks/useOpcoesSistema";

const DEFAULT_COLUMNS = [
  { key: 'pendente', label: 'Pendente', color: 'bg-yellow-500' },
  { key: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-500' },
  { key: 'concluido', label: 'Concluído', color: 'bg-green-500' },
];

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-500',
  em_andamento: 'bg-blue-500',
  concluido: 'bg-green-500',
  cancelado: 'bg-red-500',
};

interface DemandasKanbanProps {
  demandas: Record<string, Demanda[]> | undefined;
  loading: boolean;
  onSelectDemanda: (demanda: Demanda) => void;
}

export const DemandasKanban = ({ demandas, loading, onSelectDemanda }: DemandasKanbanProps) => {
  const { data: statusDb } = useOpcoesSistema('status_tarefa', true);

  const columns = statusDb && statusDb.length > 0
    ? statusDb
        .filter(s => s.valor !== 'cancelado')
        .map(s => ({ key: s.valor, label: s.label, color: STATUS_COLORS[s.valor] || 'bg-gray-500' }))
    : DEFAULT_COLUMNS;

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => (
          <Card key={col.key}>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 md:grid-cols-${Math.min(columns.length, 4)}`} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
      {columns.map((column) => {
        const columnDemandas = demandas?.[column.key] || [];
        
        return (
          <Card key={column.key} className="flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${column.color}`} />
                  {column.label}
                </div>
                <Badge variant="secondary" className="ml-2">
                  {columnDemandas.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 max-h-[calc(100vh-400px)]">
              <CardContent className="pt-4 space-y-3">
                {columnDemandas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma demanda
                  </p>
                ) : (
                  columnDemandas.map((demanda) => (
                    <DemandaCard
                      key={demanda.id}
                      demanda={demanda}
                      onClick={() => onSelectDemanda(demanda)}
                    />
                  ))
                )}
              </CardContent>
            </ScrollArea>
          </Card>
        );
      })}
    </div>
  );
};
