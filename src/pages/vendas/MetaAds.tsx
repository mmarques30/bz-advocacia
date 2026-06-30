import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useMetaMetrics } from "@/hooks/useMetaMetrics";
import { useMetaCampaigns } from "@/hooks/useMetaCampaigns";
import { useMetaAdSets } from "@/hooks/useMetaAdSets";
import { useMetaAds } from "@/hooks/useMetaAds";
import { useMetaSyncStatus } from "@/hooks/useMetaSyncStatus";
import { PeriodoFiltro } from "@/types/meta-ads";

import { MetaAdsHeader } from "@/components/meta-ads/MetaAdsHeader";
import { MetaAdsVisaoGeralTab } from "@/components/meta-ads/MetaAdsVisaoGeralTab";
import { MetaAdsInsightsTab } from "@/components/meta-ads/MetaAdsInsightsTab";
import { MetaAdsPerformanceTab } from "@/components/meta-ads/MetaAdsPerformanceTab";
import { MetaAdsCampanhasTab } from "@/components/meta-ads/MetaAdsCampanhasTab";
import { MetaAdsAdSetsTab } from "@/components/meta-ads/MetaAdsAdSetsTab";
import { MetaAdsAnunciosTab } from "@/components/meta-ads/MetaAdsAnunciosTab";
import { MetaAdsFunilTab } from "@/components/meta-ads/MetaAdsFunilTab";

export default function MetaAds() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("90d");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const { kpis, chartData } = useMetaMetrics(periodo);
  const { campanhas, isLoading: isLoadingCampaigns } = useMetaCampaigns(periodo, statusFilter);
  const { adSets, isLoading: isLoadingAdSets } = useMetaAdSets(periodo, statusFilter);
  const { ads, isLoading: isLoadingAds } = useMetaAds(periodo, statusFilter);
  const { data: syncStatus } = useMetaSyncStatus();

  return (
    <div className="space-y-4">
      <MetaAdsHeader
        kpis={kpis}
        periodo={periodo}
        onPeriodoChange={setPeriodo}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        ultimaStructure={syncStatus?.ultima_structure ?? null}
        ultimaInsights={syncStatus?.ultima_insights ?? null}
      />

      <Tabs defaultValue="visao-geral">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
          <TabsTrigger value="adsets">Ad Sets</TabsTrigger>
          <TabsTrigger value="anuncios">Anúncios</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-4 space-y-4">
          {/* Visão Geral + Funil unificados: o gráfico de performance e,
              logo abaixo, o funil (distribuição por estágio + Meta × Pipe). */}
          <MetaAdsVisaoGeralTab chartData={chartData} />
          <MetaAdsFunilTab campanhas={campanhas} periodo={periodo} />
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <MetaAdsInsightsTab campanhas={campanhas} periodo={periodo} />
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <MetaAdsPerformanceTab periodo={periodo} />
        </TabsContent>

        <TabsContent value="campanhas" className="mt-4">
          <MetaAdsCampanhasTab campanhas={campanhas} isLoading={isLoadingCampaigns} />
        </TabsContent>

        <TabsContent value="adsets" className="mt-4">
          <MetaAdsAdSetsTab adSets={adSets} isLoading={isLoadingAdSets} />
        </TabsContent>

        <TabsContent value="anuncios" className="mt-4">
          <MetaAdsAnunciosTab ads={ads} isLoading={isLoadingAds} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
