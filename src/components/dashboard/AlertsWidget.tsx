import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/types/dashboard";
import { AlertTriangle, Clock, AlertCircle, FileX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AlertsWidgetProps {
  data: Alert[];
  loading?: boolean;
}

const alertIcons = {
  lead_parado: Clock,
  prazo_vencendo: Clock,
  parcela_atrasada: AlertCircle,
  processo_sem_update: FileX,
};

const severityColors = {
  warning: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  error: "bg-red-500/10 text-red-700 border-red-500/20",
  info: "bg-blue-500/10 text-blue-700 border-blue-500/20",
};

export function AlertsWidget({ data, loading }: AlertsWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas Importantes</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-seasons flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Alertas Importantes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {data.map((alert) => {
              const Icon = alertIcons[alert.tipo];
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${severityColors[alert.severity]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.descricao}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {alert.severity}
                  </Badge>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
