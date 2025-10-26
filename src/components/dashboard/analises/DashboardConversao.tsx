import { KPICard } from "@/components/dashboard/KPICard";
import { ConversionFunnelDetailed } from "./ConversionFunnelDetailed";
import { ConversionRateEvolution } from "./ConversionRateEvolution";
import { TimePerStageTable } from "./TimePerStageTable";
import { ConversionByOriginChart } from "./ConversionByOriginChart";
import { useConversionAnalytics } from "@/hooks/useAnalytics";
import { AnalyticsFilters } from "@/types/analytics";
import { TrendingUp } from "lucide-react";

interface DashboardConversaoProps {
  filters: AnalyticsFilters;
}

export function DashboardConversao({ filters }: DashboardConversaoProps) {
  const { data, isLoading } = useConversionAnalytics(filters);

  return (
    <div className="space-y-6">
      {/* KPI Principal */}
      <KPICard
        title="Taxa de Conversão Geral"
        value={data?.taxaConversaoGeral || 0}
        icon={TrendingUp}
        format="percentage"
        trend={data?.variacao}
        loading={isLoading}
      />

      {/* Funil Detalhado */}
      <ConversionFunnelDetailed 
        data={data?.funnelDetalhado || []}
        gargalo={data?.gargalo}
        loading={isLoading}
      />

      {/* Grid de Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ConversionRateEvolution 
          data={data?.evolucaoTaxaConversao || []}
          loading={isLoading}
        />
        <TimePerStageTable 
          data={data?.tempoMedioPorEstagio || []}
          loading={isLoading}
        />
      </div>

      {/* Conversão por Origem */}
      <ConversionByOriginChart 
        data={data?.conversaoPorOrigem || []}
        loading={isLoading}
      />
    </div>
  );
}
