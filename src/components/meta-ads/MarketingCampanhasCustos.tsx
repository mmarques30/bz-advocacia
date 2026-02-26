import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from "recharts";
import { chartColors, chartTheme } from "@/lib/chartConfig";
import { MarketingCsvAnalytics } from "@/hooks/useMarketingCsvAnalytics";
import { MetaKPIs, MetaCampanha } from "@/types/meta-ads";
import { DollarSign, BarChart3, Trophy, MousePointerClick, LucideIcon, ChevronDown, ChevronUp } from "lucide-react";

const BAR_COLORS = [chartColors.primary, chartColors.secondary, chartColors.success, chartColors.warning, chartColors.dark];

interface KPISummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
}

function KPISummaryCard({ title, value, subtitle, icon: Icon }: KPISummaryCardProps) {
  return (
    <Card className="border rounded-xl bg-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </Card>
  );
}

interface Props {
  analytics: MarketingCsvAnalytics;
  metaKpis?: MetaKPIs;
  campanhas?: MetaCampanha[];
  isLoadingCampaigns?: boolean;
  mergedPlatformData?: { key: string; label: string; count: number; percentage: number }[];
}

export function MarketingCampanhasCustos({ analytics, metaKpis, campanhas, isLoadingCampaigns, mergedPlatformData }: Props) {
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const hasMetaData = metaKpis && metaKpis.gasto > 0;

  const investimentoTotal = hasMetaData
    ? `R$ ${metaKpis.gasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "-";

  const totalCampanhas = analytics.campaigns.length;

  const melhorCampanha = analytics.campaigns.length > 0
    ? analytics.campaigns.reduce((best, c) => c.taxaConversao > best.taxaConversao ? c : best, analytics.campaigns[0])
    : null;

  const cpcMedio = hasMetaData && metaKpis.cpc > 0
    ? `R$ ${metaKpis.cpc.toFixed(2)}`
    : "-";

  const displayedCampaigns = showAllCampaigns ? analytics.campaigns : analytics.campaigns.slice(0, 5);

  const platformData = mergedPlatformData && mergedPlatformData.length > 0 ? mergedPlatformData : analytics.platformKPIs;

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPISummaryCard title="Investimento Total" value={investimentoTotal} subtitle="Gasto acumulado no período" icon={DollarSign} />
        <KPISummaryCard title="Total de Anúncios" value={String(totalCampanhas)} subtitle="Anúncios ativos" icon={BarChart3} />
        <KPISummaryCard title="Melhor Anúncio" value={melhorCampanha ? `${melhorCampanha.taxaConversao}%` : "-"} subtitle={melhorCampanha ? melhorCampanha.campaign.slice(0, 30) : "Sem dados"} icon={Trophy} />
        <KPISummaryCard title="CPC Médio" value={cpcMedio} subtitle="Custo por clique" icon={MousePointerClick} />
      </div>

      {/* Evolution Chart */}
      {analytics.dailyLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Leads por Dia</CardTitle>
            <p className="text-sm text-muted-foreground">Distribuição diária por plataforma de origem</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={analytics.dailyLeads}>
                <CartesianGrid strokeDasharray={chartTheme.grid.strokeDasharray} stroke={chartTheme.grid.stroke} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={chartTheme.tooltip.contentStyle} />
                <Legend />
                <Area type="monotone" dataKey="fb" name="Facebook" stackId="1" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.6} />
                <Area type="monotone" dataKey="ig" name="Instagram" stackId="1" stroke={chartColors.secondary} fill={chartColors.secondary} fillOpacity={0.6} />
                <Area type="monotone" dataKey="organic" name="Orgânico" stackId="1" stroke={chartColors.success} fill={chartColors.success} fillOpacity={0.6} />
                <Area type="monotone" dataKey="outro" name="Outro" stackId="1" stroke={chartColors.warning} fill={chartColors.warning} fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Anúncio</CardTitle>
          <p className="text-sm text-muted-foreground">Métricas detalhadas por anúncio</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingCampaigns ? (
            <Skeleton className="h-48 w-full" />
          ) : analytics.campaigns.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Anúncio</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Enviados</TableHead>
                      <TableHead className="text-right">Qualif.</TableHead>
                      <TableHead className="text-right">Conv.</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedCampaigns.map((c) => (
                      <TableRow key={c.campaign}>
                        <TableCell className="font-medium max-w-[180px] truncate" title={c.campaign}>{c.campaign}</TableCell>
                        <TableCell className="text-right">{c.total}</TableCell>
                        <TableCell className="text-right">{c.enviados}</TableCell>
                        <TableCell className="text-right">{c.qualificados}</TableCell>
                        <TableCell className="text-right">{c.convertidos}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={c.taxaConversao > 0 ? "default" : "secondary"}>
                            {c.taxaConversao}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {analytics.campaigns.length > 5 && (
                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" onClick={() => setShowAllCampaigns(!showAllCampaigns)}>
                    {showAllCampaigns ? (
                      <><ChevronUp className="h-4 w-4 mr-1" /> Ver menos</>
                    ) : (
                      <><ChevronDown className="h-4 w-4 mr-1" /> Ver mais ({analytics.campaigns.length - 5} restantes)</>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum anúncio encontrado</p>
          )}
        </CardContent>
      </Card>

      {/* Platform Distribution - Bar Chart */}
      {platformData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Plataforma</CardTitle>
            <p className="text-sm text-muted-foreground">Origem dos leads por canal (CSV + orgânico)</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray={chartTheme.grid.strokeDasharray} stroke={chartTheme.grid.stroke} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  contentStyle={chartTheme.tooltip.contentStyle}
                  formatter={(value: number, name: string) => [`${value} leads`, name]}
                />
                <Bar dataKey="count" name="Leads" radius={[6, 6, 0, 0]}>
                  {platformData.map((_, idx) => (
                    <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
