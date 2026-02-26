import { useState } from "react";
import { MarketingDashboardKPIs } from "@/components/meta-ads/MarketingDashboardKPIs";
import { MarketingPerformanceChart } from "@/components/meta-ads/MarketingPerformanceChart";
import { MarketingFunnelChart } from "@/components/meta-ads/MarketingFunnelChart";
import { MarketingServiceDistribution } from "@/components/meta-ads/MarketingServiceDistribution";
import { MarketingCampanhasCustos } from "@/components/meta-ads/MarketingCampanhasCustos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMetaMetrics } from "@/hooks/useMetaMetrics";
import { useMetaCampaigns } from "@/hooks/useMetaCampaigns";
import { useMarketingCsvAnalytics } from "@/hooks/useMarketingCsvAnalytics";
import { PeriodoFiltro } from "@/types/meta-ads";

export default function MetaAds() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("90d");
  const { kpis, isLoading: isLoadingMetrics } = useMetaMetrics(periodo);
  const { campanhas, isLoading: isLoadingCampaigns } = useMetaCampaigns();
  const csvAnalytics = useMarketingCsvAnalytics(periodo);

  const investimentoTotal = kpis && kpis.gasto > 0
    ? `R$ ${kpis.gasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "R$ 0,00";

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
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Período completo</p>
            <p className="text-2xl font-bold">{investimentoTotal}</p>
          </div>
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
          <MarketingDashboardKPIs analytics={csvAnalytics} metaKpis={kpis} />

          {/* Performance Chart */}
          <MarketingPerformanceChart data={csvAnalytics.dailyConversions} />

          {/* Funnel + Service Distribution side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MarketingFunnelChart data={csvAnalytics.funnel} />
            <MarketingServiceDistribution data={csvAnalytics.serviceDistribution} />
          </div>
        </TabsContent>

        <TabsContent value="campanhas" className="space-y-6">
          <MarketingCampanhasCustos
            analytics={csvAnalytics}
            metaKpis={kpis}
            campanhas={campanhas}
            isLoadingCampaigns={isLoadingCampaigns}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
