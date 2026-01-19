import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DemandaCard } from "./DemandaCard";
import { Demanda, STATUS_LABELS } from "@/types/demandas";

interface DemandasKanbanProps {
  demandas: {
    pendente: Demanda[];
    em_andamento: Demanda[];
    concluido: Demanda[];
  } | undefined;
  loading: boolean;
  onSelectDemanda: (demanda: Demanda) => void;
}

const columns = [
  { key: 'pendente', label: 'Pendente', color: 'bg-yellow-500' },
  { key: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-500' },
  { key: 'concluido', label: 'Concluído', color: 'bg-green-500' },
] as const;

export const DemandasKanban = ({ demandas, loading, onSelectDemanda }: DemandasKanbanProps) => {
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
    <div className="grid gap-4 md:grid-cols-3">
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
