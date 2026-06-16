import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Target, Layers, ImageIcon, GitBranch } from "lucide-react";

import { useMetaMetrics } from "@/hooks/useMetaMetrics";
import { useMetaCampaigns } from "@/hooks/useMetaCampaigns";
import { useMetaAdSets } from "@/hooks/useMetaAdSets";
import { useMetaAds } from "@/hooks/useMetaAds";
import { useMetaSyncStatus } from "@/hooks/useMetaSyncStatus";
import { PeriodoFiltro } from "@/types/meta-ads";

import { MetaAdsHeader } from "@/components/meta-ads/MetaAdsHeader";
import { MetaAdsVisaoGeralTab } from "@/components/meta-ads/MetaAdsVisaoGeralTab";
import { MetaAdsCampanhasTab } from "@/components/meta-ads/MetaAdsCampanhasTab";
import { MetaAdsAdSetsTab } from "@/components/meta-ads/MetaAdsAdSetsTab";
import { MetaAdsAnunciosTab } from "@/components/meta-ads/MetaAdsAnunciosTab";
import { MetaAdsFunilTab } from "@/components/meta-ads/MetaAdsFunilTab";

/**
 * Dashboard de Marketing — fiel a hierarquia do Meta Ads:
 *  Conta -> Campanhas -> Ad Sets -> Ads (Criativos).
 *
 * Dados:
 *  - Header: useMetaMetrics (meta_insights_daily + v_meta_lead_funnel)
 *  - Visao Geral: chartData + campanhas (donut por objetivo)
 *  - Campanhas: useMetaCampaigns
 *  - Ad Sets:   useMetaAdSets
 *  - Anuncios:  useMetaAds (com criativos)
 *  - Funil:     v_meta_lead_funnel agrupado por status_sdr
 */
export default function MetaAds() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("90d");

  const { kpis, chartData } = useMetaMetrics(periodo);
  const { campanhas, isLoading: isLoadingCampaigns } = useMetaCampaigns(periodo);
  const { adSets, isLoading: isLoadingAdSets } = useMetaAdSets(periodo);
  const { ads, isLoading: isLoadingAds } = useMetaAds(periodo);
  const { data: syncStatus } = useMetaSyncStatus();

  return (
    <div className="space-y-6">
      <MetaAdsHeader
        kpis={kpis}
        periodo={periodo}
        onPeriodoChange={setPeriodo}
        ultimaStructure={syncStatus?.ultima_structure ?? null}
        ultimaInsights={syncStatus?.ultima_insights ?? null}
      />

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="campanhas" className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Campanhas
          </TabsTrigger>
          <TabsTrigger value="adsets" className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Ad Sets
          </TabsTrigger>
          <TabsTrigger value="anuncios" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Anúncios
          </TabsTrigger>
          <TabsTrigger value="funil" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" /> Funil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-4">
          <MetaAdsVisaoGeralTab chartData={chartData} campanhas={campanhas} />
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

        <TabsContent value="funil" className="mt-4">
          <MetaAdsFunilTab periodo={periodo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
