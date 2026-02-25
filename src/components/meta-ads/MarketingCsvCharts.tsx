import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
  Area, AreaChart,
} from "recharts";
import { chartColors, chartTheme } from "@/lib/chartConfig";
import type { MarketingCsvAnalytics } from "@/hooks/useMarketingCsvAnalytics";

interface Props {
  analytics: MarketingCsvAnalytics;
  showFunnel?: boolean;
  showPlatform?: boolean;
  showEvolution?: boolean;
  showCampaigns?: boolean;
}

const PIE_COLORS = [chartColors.primary, chartColors.secondary, chartColors.success, chartColors.warning, chartColors.dark];

export function MarketingCsvCharts({ analytics, showFunnel = true, showPlatform = true, showEvolution = true, showCampaigns = false }: Props) {
  const { funnel, platformKPIs, dailyLeads, campaigns, isLoading } = analytics;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Funil de Status */}
      {showFunnel && (
        <Card>
          <CardHeader><CardTitle className="text-base">Funil de Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnel} layout="vertical">
                <CartesianGrid {...chartTheme.grid} horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={90} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={chartTheme.tooltip.contentStyle}
                  formatter={(value: number, _name: string, props: any) => [`${value} (${props.payload.percentage}%)`, "Leads"]}
                />
                <Bar dataKey="count" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Distribuição por Plataforma */}
      {showPlatform && (
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por Plataforma</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={platformKPIs}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  nameKey="label"
                  label={({ label, percentage }) => `${label} ${percentage}%`}
                >
                  {platformKPIs.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTheme.tooltip.contentStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Evolução de Leads */}
      {showEvolution && dailyLeads.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Evolução de Leads por Dia</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyLeads}>
                <CartesianGrid {...chartTheme.grid} />
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

      {/* Performance por Campanha */}
      {showCampaigns && campaigns.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Performance por Campanha</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Enviados</TableHead>
                  <TableHead className="text-right">Qualificados</TableHead>
                  <TableHead className="text-right">Convertidos</TableHead>
                  <TableHead className="text-right">Conversão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.slice(0, 10).map((c) => (
                  <TableRow key={c.campaign}>
                    <TableCell className="font-medium max-w-[200px] truncate">{c.campaign}</TableCell>
                    <TableCell className="text-right">{c.total}</TableCell>
                    <TableCell className="text-right">{c.enviados}</TableCell>
                    <TableCell className="text-right">{c.qualificados}</TableCell>
                    <TableCell className="text-right">{c.convertidos}</TableCell>
                    <TableCell className="text-right">{c.taxaConversao}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
