import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, AlertTriangle, Clock, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIA_LABELS } from "@/types/demandas";

interface DemandasKPIsProps {
  stats: {
    total: number;
    atrasadas: number;
    urgentes: number;
    topCategoria: { nome: string; count: number } | null;
  } | undefined;
  loading: boolean;
}

export const DemandasKPIs = ({ stats, loading }: DemandasKPIsProps) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      titulo: "Total de Demandas",
      valor: stats?.total || 0,
      icon: ClipboardList,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      titulo: "Atrasadas",
      valor: stats?.atrasadas || 0,
      icon: AlertTriangle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      titulo: "Urgentes",
      valor: stats?.urgentes || 0,
      icon: Clock,
      iconColor: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      titulo: "Categoria Principal",
      valor: stats?.topCategoria 
        ? CATEGORIA_LABELS[stats.topCategoria.nome as keyof typeof CATEGORIA_LABELS] || stats.topCategoria.nome
        : "-",
      subtitulo: stats?.topCategoria ? `${stats.topCategoria.count} demandas` : undefined,
      icon: Layers,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.titulo}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-6 w-6 ${kpi.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{kpi.titulo}</p>
                <p className="text-2xl font-bold">{kpi.valor}</p>
                {kpi.subtitulo && (
                  <p className="text-xs text-muted-foreground">{kpi.subtitulo}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
