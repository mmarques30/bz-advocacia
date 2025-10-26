import { ChannelPerformanceCard } from "./ChannelPerformanceCard";
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
      {/* Cards Comparativos (Grid de 4) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <ChannelPerformanceCard key={i} channel={{} as any} loading={true} />
          ))
        ) : (
          channelData?.map(channel => (
            <ChannelPerformanceCard 
              key={channel.origem}
              channel={channel}
              loading={false}
            />
          ))
        )}
      </div>

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
