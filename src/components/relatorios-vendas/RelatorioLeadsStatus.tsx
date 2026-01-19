import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, PieChart } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRelatoriosVendasPeriodo } from "@/hooks/useRelatoriosVendasPeriodo";

interface RelatorioLeadsStatusProps {
  dataInicio: Date;
  dataFim: Date;
}

const STATUS_COLORS: Record<string, string> = {
  'Pendente': '#f59e0b',
  'Em Andamento': '#3b82f6',
  'Concluído': '#22c55e',
  'Cancelado': '#ef4444',
  'Aguardando': '#8b5cf6',
};

const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export function RelatorioLeadsStatus({ dataInicio, dataFim }: RelatorioLeadsStatusProps) {
  const { data, isLoading } = useRelatoriosVendasPeriodo(dataInicio, dataFim);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const statusData = data?.status || [];
  const totalLeads = data?.kpis?.totalLeads || 0;

  const pieData = statusData.map((item, index) => ({
    name: item.status,
    value: item.quantidade,
    fill: STATUS_COLORS[item.status] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const exportData = statusData.map(item => ({
    Status: item.status,
    Quantidade: item.quantidade,
    "Percentual (%)": item.percentual.toFixed(1),
  }));

  const handleExportPDF = () => {
    exportToPDF(exportData, "Relatório Leads por Status");
  };

  const handleExportCSV = () => {
    exportToCSV(exportData, "relatorio-leads-status");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <PieChart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Leads por Status</CardTitle>
              <CardDescription>
                {format(dataInicio, "dd 'de' MMMM", { locale: ptBR })} até {format(dataFim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Leads</CardDescription>
              <CardTitle className="text-2xl">{totalLeads}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Status Distintos</CardDescription>
              <CardTitle className="text-2xl">{statusData.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Status Mais Comum</CardDescription>
              <CardTitle className="text-xl">{statusData[0]?.status || "-"}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {statusData[0]?.quantidade || 0} leads ({statusData[0]?.percentual.toFixed(1) || 0}%)
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Gráfico de Pizza */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda detalhada */}
          <div className="space-y-3">
            {statusData.map((item, index) => (
              <div key={item.status} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: STATUS_COLORS[item.status] || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
                  />
                  <span className="font-medium">{item.status}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{item.quantidade}</div>
                  <div className="text-sm text-muted-foreground">{item.percentual.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Percentual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statusData.map((item, index) => (
                <TableRow key={item.status}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: STATUS_COLORS[item.status] || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
                      />
                      {item.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantidade}</TableCell>
                  <TableCell className="text-right">{item.percentual.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              {statusData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhum lead encontrado no período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
