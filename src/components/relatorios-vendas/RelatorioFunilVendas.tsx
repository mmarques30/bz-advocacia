import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, FunnelChart, Funnel, LabelList } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { chartColors } from "@/lib/chartConfig";
import { useRelatoriosVendasPeriodo } from "@/hooks/useRelatoriosVendasPeriodo";
import { Progress } from "@/components/ui/progress";

interface RelatorioFunilVendasProps {
  dataInicio: Date;
  dataFim: Date;
}

const FUNNEL_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#22c55e'];

export function RelatorioFunilVendas({ dataInicio, dataFim }: RelatorioFunilVendasProps) {
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

  const funil = data?.funil || [];
  const totalLeads = data?.kpis?.totalLeads || 0;
  const taxaConversaoGeral = data?.kpis?.taxaConversao || 0;

  const funnelData = funil.map((item, index) => ({
    ...item,
    fill: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
    value: item.quantidade,
    name: item.label,
  }));

  const exportData = funil.map(item => ({
    Estágio: item.label,
    Quantidade: item.quantidade,
    "Percentual (%)": item.percentual.toFixed(1),
  }));

  const handleExportPDF = () => {
    exportToPDF(exportData, "Relatório Funil de Vendas");
  };

  const handleExportCSV = () => {
    exportToCSV(exportData, "relatorio-funil-vendas");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Filter className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Funil de Vendas</CardTitle>
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
              <CardDescription>Total no Funil</CardDescription>
              <CardTitle className="text-2xl">{totalLeads}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Taxa de Conversão</CardDescription>
              <CardTitle className="text-2xl">{taxaConversaoGeral.toFixed(1)}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Leads Convertidos</CardDescription>
              <CardTitle className="text-2xl">{data?.kpis?.leadsConvertidos || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Visualização do Funil */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico de barras horizontal */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funil} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  dataKey="label" 
                  type="category" 
                  width={120} 
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value, name) => [`${value} leads`, 'Quantidade']}
                />
                <Bar dataKey="quantidade" name="Quantidade">
                  {funil.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Visualização com Progress bars */}
          <div className="space-y-4">
            {funil.map((item, index) => (
              <div key={item.estagio} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.quantidade} ({item.percentual.toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={item.percentual} 
                  className="h-3"
                  style={{ 
                    // @ts-ignore
                    '--progress-background': FUNNEL_COLORS[index % FUNNEL_COLORS.length] 
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estágio</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Percentual</TableHead>
                <TableHead className="text-right">Conversão Acumulada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funil.map((item, index) => {
                const acumulado = funil.slice(index).reduce((acc, i) => acc + i.quantidade, 0);
                const percentualAcumulado = totalLeads > 0 ? (acumulado / totalLeads) * 100 : 0;
                
                return (
                  <TableRow key={item.estagio}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: FUNNEL_COLORS[index % FUNNEL_COLORS.length] }}
                        />
                        {item.label}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantidade}</TableCell>
                    <TableCell className="text-right">{item.percentual.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{percentualAcumulado.toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
