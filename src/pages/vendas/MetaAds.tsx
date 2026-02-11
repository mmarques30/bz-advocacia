import { useState } from "react";
import { MetaAdsKPIs } from "@/components/meta-ads/MetaAdsKPIs";
import { MetaAdsCampaigns } from "@/components/meta-ads/MetaAdsCampaigns";
import { MetaAdsChart } from "@/components/meta-ads/MetaAdsChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMetaMetrics } from "@/hooks/useMetaMetrics";
import { useMetaCampaigns } from "@/hooks/useMetaCampaigns";
import { useDateFilter } from "@/hooks/useDateFilter";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardConversao } from "@/components/dashboard/analises/DashboardConversao";
import { DashboardPerformanceCanal } from "@/components/dashboard/analises/DashboardPerformanceCanal";
import { PeriodoFiltro } from "@/types/meta-ads";
import { TrendingUp, DollarSign, Users, Target, BarChart3 } from "lucide-react";

function ROICard({ kpis, isLoading }: { kpis: any; isLoading: boolean }) {
  const roi = kpis?.gasto > 0 ? ((((kpis?.leads || 0) * (kpis?.custoLead || 0)) - kpis.gasto) / kpis.gasto * 100) : 0;

  const metrics = [
    {
      label: "Investimento Total",
      value: isLoading ? "—" : `R$ ${(kpis?.gasto || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
    },
    {
      label: "Leads Gerados",
      value: isLoading ? "—" : String(kpis?.leads || 0),
      icon: Users,
    },
    {
      label: "CPL (Custo/Lead)",
      value: isLoading ? "—" : `R$ ${(kpis?.custoLead || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: Target,
    },
    {
      label: "ROI Estimado",
      value: isLoading ? "—" : `${roi.toFixed(1)}%`,
      icon: BarChart3,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          Resumo de ROI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <m.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold">{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MetaAds() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("30d");
  const { kpis, chartData, isLoading: isLoadingMetrics } = useMetaMetrics(periodo);
  const { campanhas, isLoading: isLoadingCampaigns } = useMetaCampaigns();
  const { filters, setPreset, clearFilters } = useDateFilter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
        <p className="text-muted-foreground">
          Acompanhe a performance das suas campanhas e análises de conversão
        </p>
      </div>

      <Tabs defaultValue="resumo" className="space-y-6">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="conversao">Análise de Conversão</TabsTrigger>
          <TabsTrigger value="canais">Performance por Canal</TabsTrigger>
        </TabsList>

        {/* Aba Resumo */}
        <TabsContent value="resumo" className="space-y-6">
          <div className="flex items-center gap-4">
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

          <ROICard kpis={kpis} isLoading={isLoadingMetrics} />
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
        </TabsContent>

        {/* Aba Conversão */}
        <TabsContent value="conversao" className="space-y-6">
          <DashboardFilters
            periodo={filters.periodo}
            onPeriodoChange={setPreset}
            onClearFilters={clearFilters}
          />
          <DashboardConversao filters={filters} />
        </TabsContent>

        {/* Aba Canais */}
        <TabsContent value="canais" className="space-y-6">
          <DashboardFilters
            periodo={filters.periodo}
            onPeriodoChange={setPreset}
            onClearFilters={clearFilters}
          />
          <DashboardPerformanceCanal filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
