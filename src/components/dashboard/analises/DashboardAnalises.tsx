import { KPICard } from "@/components/dashboard/KPICard";
import { ConversionFunnelDetailed } from "./ConversionFunnelDetailed";
import { ConversionRateEvolution } from "./ConversionRateEvolution";
import { TimePerStageTable } from "./TimePerStageTable";
import { LeadsDistributionChart } from "./LeadsDistributionChart";
import { ChannelEvolutionChart } from "./ChannelEvolutionChart";
import { ChannelComparisonTable } from "./ChannelComparisonTable";
import { AutoInsightsWidget } from "./AutoInsightsWidget";
import { useConversionAnalytics, useChannelPerformance, useChannelEvolution, useAutoInsights } from "@/hooks/useAnalytics";
import { AnalyticsFilters } from "@/types/analytics";
import { TrendingUp } from "lucide-react";

interface DashboardAnalisesProps {
  filters: AnalyticsFilters;
}

export function DashboardAnalises({ filters }: DashboardAnalisesProps) {
  const { data: conversionData, isLoading: conversionLoading } = useConversionAnalytics(filters);
  const { data: channelData, isLoading: channelLoading } = useChannelPerformance(filters);
  const { data: evolutionData, isLoading: evolutionLoading } = useChannelEvolution(filters);
  const { data: insights } = useAutoInsights(channelData);

  return (
    <div className="space-y-6">
      {/* KPI de Conversão + Insights */}
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <KPICard
          title="Taxa de Conversão Geral"
          value={conversionData?.taxaConversaoGeral || 0}
          icon={TrendingUp}
          format="percentage"
          trend={conversionData?.variacao}
          loading={conversionLoading}
        />
        {insights && insights.length > 0 && (
          <AutoInsightsWidget insights={insights} />
        )}
      </div>

      {/* Funil Detalhado */}
      <ConversionFunnelDetailed
        data={conversionData?.funnelDetalhado || []}
        gargalo={conversionData?.gargalo}
        loading={conversionLoading}
      />

      {/* Grid: Evolução Conversão + Distribuição Leads */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ConversionRateEvolution
          data={conversionData?.evolucaoTaxaConversao || []}
          loading={conversionLoading}
        />
        <LeadsDistributionChart data={channelData} loading={channelLoading} />
      </div>

      {/* Grid: Evolução por Canal + Tempo por Estágio */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChannelEvolutionChart data={evolutionData} loading={evolutionLoading} />
        <TimePerStageTable
          data={conversionData?.tempoMedioPorEstagio || []}
          loading={conversionLoading}
        />
      </div>

      {/* Tabela Comparativa de Canais */}
      <ChannelComparisonTable data={channelData} loading={channelLoading} />
    </div>
  );
}
