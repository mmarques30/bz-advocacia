import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { chartColors } from "@/lib/chartConfig";
import { useRelatoriosVendasPeriodo } from "@/hooks/useRelatoriosVendasPeriodo";

interface RelatorioPerformanceCampanhaProps {
  dataInicio: Date;
  dataFim: Date;
}

const COLORS = [chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.muted, '#8884d8', '#82ca9d'];

export function RelatorioPerformanceCampanha({ dataInicio, dataFim }: RelatorioPerformanceCampanhaProps) {
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

  const campanhas = data?.campanhas || [];
  const totalLeads = campanhas.reduce((acc, c) => acc + c.totalLeads, 0);
  const totalConvertidos = campanhas.reduce((acc, c) => acc + c.leadsConvertidos, 0);
  const melhorCampanha = campanhas.length > 0 ? campanhas[0] : null;

  const exportData = campanhas.map(c => ({
    Campanha: c.campanha,
    "Total Leads": c.totalLeads,
    "Leads Contatados": c.leadsContatados,
    "Leads Convertidos": c.leadsConvertidos,
    "Taxa de Conversão (%)": c.taxaConversao.toFixed(1),
    "Valor Médio Proposta": c.valorMedioPropostas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  }));

  const handleExportPDF = () => {
    exportToPDF(exportData, "Relatório Performance por Campanha");
  };

  const handleExportCSV = () => {
    exportToCSV(exportData, "relatorio-performance-campanha");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Performance por Campanha</CardTitle>
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
              <CardDescription>Total de Campanhas</CardDescription>
              <CardTitle className="text-2xl">{campanhas.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Leads</CardDescription>
              <CardTitle className="text-2xl">{totalLeads}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Melhor Campanha</CardDescription>
              <CardTitle className="text-xl truncate">{melhorCampanha?.campanha || "-"}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {melhorCampanha?.totalLeads} leads ({melhorCampanha?.taxaConversao.toFixed(1)}% conversão)
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Gráfico */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={campanhas.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis 
                dataKey="campanha" 
                type="category" 
                width={150} 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="totalLeads" name="Total Leads">
                {campanhas.slice(0, 10).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Contatados</TableHead>
                <TableHead className="text-right">Convertidos</TableHead>
                <TableHead className="text-right">Taxa Conversão</TableHead>
                <TableHead className="text-right">Valor Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campanhas.map((campanha, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{campanha.campanha}</TableCell>
                  <TableCell className="text-right">{campanha.totalLeads}</TableCell>
                  <TableCell className="text-right">{campanha.leadsContatados}</TableCell>
                  <TableCell className="text-right">{campanha.leadsConvertidos}</TableCell>
                  <TableCell className="text-right">
                    <span className={campanha.taxaConversao > 10 ? "text-green-600" : "text-muted-foreground"}>
                      {campanha.taxaConversao.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {campanha.valorMedioPropostas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                </TableRow>
              ))}
              {campanhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma campanha encontrada no período
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
