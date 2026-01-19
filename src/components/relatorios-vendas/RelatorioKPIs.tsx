import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserPlus, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface KPIsData {
  totalLeads: number;
  leadsContatados: number;
  leadsConvertidos: number;
  taxaContato: number;
  taxaConversao: number;
  tempoMedioConversao: number | null;
  valorTotalPropostas: number;
}

interface RelatorioKPIsProps {
  kpis: KPIsData | undefined;
  isLoading: boolean;
}

export function RelatorioKPIs({ kpis, isLoading }: RelatorioKPIsProps) {
  const kpiItems = [
    {
      title: "Total de Leads",
      value: kpis?.totalLeads || 0,
      icon: Users,
      format: "number",
      color: "text-blue-600"
    },
    {
      title: "Contatados",
      value: kpis?.leadsContatados || 0,
      icon: UserCheck,
      format: "number",
      color: "text-amber-600"
    },
    {
      title: "Convertidos",
      value: kpis?.leadsConvertidos || 0,
      icon: UserPlus,
      format: "number",
      color: "text-green-600"
    },
    {
      title: "Taxa de Conversão",
      value: kpis?.taxaConversao || 0,
      icon: TrendingUp,
      format: "percent",
      color: "text-purple-600"
    },
    {
      title: "Tempo Médio",
      value: kpis?.tempoMedioConversao || 0,
      icon: Clock,
      format: "days",
      color: "text-orange-600"
    },
    {
      title: "Valor Propostas",
      value: kpis?.valorTotalPropostas || 0,
      icon: DollarSign,
      format: "currency",
      color: "text-emerald-600"
    }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "percent":
        return `${value.toFixed(1)}%`;
      case "days":
        return value > 0 ? `${value} dias` : "-";
      case "currency":
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
      default:
        return value.toString();
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpiItems.map((item) => (
        <Card key={item.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <p className="text-2xl font-bold mt-2">
              {formatValue(item.value, item.format)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
