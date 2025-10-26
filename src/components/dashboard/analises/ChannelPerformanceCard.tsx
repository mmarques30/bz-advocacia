import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelPerformance } from "@/types/analytics";
import { Users, TrendingUp, DollarSign, Clock } from "lucide-react";

interface ChannelPerformanceCardProps {
  channel: ChannelPerformance;
  loading?: boolean;
}

export function ChannelPerformanceCard({ channel, loading }: ChannelPerformanceCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: "Total de Leads",
      value: channel.totalLeads,
      icon: Users,
      format: (v: number) => v.toString(),
    },
    {
      label: "Taxa de Conversão",
      value: channel.taxaConversao,
      icon: TrendingUp,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      label: "Ticket Médio",
      value: channel.ticketMedio,
      icon: DollarSign,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    },
    {
      label: "Tempo Médio",
      value: channel.tempoMedioConversao,
      icon: Clock,
      format: (v: number) => `${Math.round(v)} dias`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{channel.origem}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-3 w-3" />
                  <span className="text-xs">{metric.label}</span>
                </div>
                <div className="text-lg font-bold">{metric.format(metric.value)}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
