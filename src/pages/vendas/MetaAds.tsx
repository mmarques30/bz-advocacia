import { useState } from "react";
import { MarketingDashboardKPIs } from "@/components/meta-ads/MarketingDashboardKPIs";
import { MarketingPerformanceChart } from "@/components/meta-ads/MarketingPerformanceChart";
import { MarketingFunnelChart } from "@/components/meta-ads/MarketingFunnelChart";
import { MarketingServiceDistribution } from "@/components/meta-ads/MarketingServiceDistribution";
import { MarketingCsvCharts } from "@/components/meta-ads/MarketingCsvCharts";
import { MetaAdsKPIs } from "@/components/meta-ads/MetaAdsKPIs";
import { MetaAdsChart } from "@/components/meta-ads/MetaAdsChart";
import { MetaAdsCampaigns } from "@/components/meta-ads/MetaAdsCampaigns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMetaMetrics } from "@/hooks/useMetaMetrics";
import { useMetaCampaigns } from "@/hooks/useMetaCampaigns";
import { useMarketingCsvAnalytics } from "@/hooks/useMarketingCsvAnalytics";
import { PeriodoFiltro } from "@/types/meta-ads";
import { TrendingUp, Users } from "lucide-react";

export default function MetaAds() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("90d");
  const { kpis, chartData, isLoading: isLoadingMetrics } = useMetaMetrics(periodo);
  const { campanhas, isLoading: isLoadingCampaigns } = useMetaCampaigns();
  const csvAnalytics = useMarketingCsvAnalytics(periodo);

  const hasMetaData = kpis && (kpis.impressoes > 0 || kpis.cliques > 0 || kpis.leads > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Marketing</h1>
          <p className="text-muted-foreground">
            Acompanhe a performance das suas campanhas e análises de conversão
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1.5">
            <Users className="h-4 w-4 mr-1.5" />
            {csvAnalytics.totalLeads} leads no período
          </Badge>
          <Select value={periodo} onValueChange={(value) => setPeriodo(value as PeriodoFiltro)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Performance & ROI</TabsTrigger>
          <TabsTrigger value="campanhas">Campanhas & Custos</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* KPI Cards */}
          <MarketingDashboardKPIs analytics={csvAnalytics} />

          {/* Performance Chart */}
          <MarketingPerformanceChart data={csvAnalytics.dailyConversions} />

          {/* Funnel + Service Distribution side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MarketingFunnelChart data={csvAnalytics.funnel} />
            <MarketingServiceDistribution data={csvAnalytics.serviceDistribution} />
          </div>

          {/* Meta Ads data if available */}
          {hasMetaData && (
            <>
              <MetaAdsKPIs kpis={kpis} isLoading={isLoadingMetrics} />
              <MetaAdsChart data={chartData} isLoading={isLoadingMetrics} />
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Campanhas Ativas</CardTitle>
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <MetaAdsCampaigns campanhas={campanhas} isLoading={isLoadingCampaigns} />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="campanhas" className="space-y-6">
          <MarketingCsvCharts
            analytics={csvAnalytics}
            showFunnel={false}
            showPlatform={true}
            showEvolution={true}
            showCampaigns={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
