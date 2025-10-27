import { LeadsDistributionChart } from "./LeadsDistributionChart";
import { ChannelEvolutionChart } from "./ChannelEvolutionChart";
import { ChannelComparisonTable } from "./ChannelComparisonTable";
import { AutoInsightsWidget } from "./AutoInsightsWidget";
import { useChannelPerformance, useChannelEvolution, useAutoInsights } from "@/hooks/useAnalytics";
import { AnalyticsFilters } from "@/types/analytics";

interface DashboardPerformanceCanalProps {
  filters: AnalyticsFilters;
}

export function DashboardPerformanceCanal({ filters }: DashboardPerformanceCanalProps) {
  const { data: channelData, isLoading } = useChannelPerformance(filters);
  const { data: evolutionData, isLoading: evolutionLoading } = useChannelEvolution(filters);
  const { data: insights } = useAutoInsights(channelData);

  return (
    <div className="space-y-6">
      {/* Insights Automáticos */}
      {insights && insights.length > 0 && (
        <AutoInsightsWidget insights={insights} />
      )}

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LeadsDistributionChart data={channelData} loading={isLoading} />
        <ChannelEvolutionChart data={evolutionData} loading={evolutionLoading} />
      </div>

      {/* Tabela Comparativa */}
      <ChannelComparisonTable data={channelData} loading={isLoading} />
    </div>
  );
}
