import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetaAdsConnection } from "@/components/meta-ads/MetaAdsConnection";
import { MetaAdsKPIs } from "@/components/meta-ads/MetaAdsKPIs";
import { MetaAdsCampaigns } from "@/components/meta-ads/MetaAdsCampaigns";
import { MetaAdsChart } from "@/components/meta-ads/MetaAdsChart";
import { MetaAdsReportDialog } from "@/components/meta-ads/MetaAdsReportDialog";
import { MetaAdsAutomation } from "@/components/meta-ads/MetaAdsAutomation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMetaMetrics } from "@/hooks/useMetaMetrics";
import { useMetaCampaigns } from "@/hooks/useMetaCampaigns";
import { PeriodoFiltro } from "@/types/meta-ads";
import { TrendingUp } from "lucide-react";

export default function MetaAds() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("30d");
  const { kpis, chartData, isLoading: isLoadingMetrics } = useMetaMetrics(periodo);
  const { campanhas, isLoading: isLoadingCampaigns } = useMetaCampaigns();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meta Ads</h1>
          <p className="text-muted-foreground">
            Acompanhe a performance das suas campanhas de marketing
          </p>
        </div>

        {/* Connection Status */}
        <MetaAdsConnection />

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Período:</span>
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
          <MetaAdsReportDialog />
        </div>

        {/* KPIs */}
        <MetaAdsKPIs kpis={kpis} isLoading={isLoadingMetrics} />

        {/* Chart */}
        <MetaAdsChart data={chartData} isLoading={isLoadingMetrics} />

        {/* Campaigns Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Campanhas Ativas</CardTitle>
                <CardDescription>Performance detalhada por campanha</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <MetaAdsCampaigns campanhas={campanhas} isLoading={isLoadingCampaigns} />
          </CardContent>
        </Card>

        {/* Automation */}
        <MetaAdsAutomation />
      </div>
    </DashboardLayout>
  );
}
