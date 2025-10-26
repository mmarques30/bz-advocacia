import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDistribuicaoTipo } from "@/hooks/useFinanceiro";
import { Download, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { chartColors } from "@/lib/chartConfig";

export function RelatorioPerformanceTipo() {
  const { data: distribuicao, isLoading } = useDistribuicaoTipo();

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

  const total = distribuicao?.reduce((sum, d) => sum + Number(d.valor), 0) || 0;
  const totalAcordos = distribuicao?.reduce((sum, d) => sum + d.quantidade, 0) || 0;

  const COLORS = [chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.success, chartColors.warning];

  const handleExportPDF = () => {
    exportToPDF(distribuicao, "Relatório de Performance por Tipo");
  };

  const handleExportCSV = () => {
    exportToCSV(distribuicao, "relatorio-performance-tipo");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Performance por Tipo de Serviço</CardTitle>
            <CardDescription>Distribuição de receita por tipo de processo</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Receita Total</CardDescription>
              <CardTitle className="text-2xl">
                {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Acordos</CardDescription>
              <CardTitle className="text-2xl">{totalAcordos}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Tipos de Serviço</CardDescription>
              <CardTitle className="text-2xl">{distribuicao?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Gráfico de Barras Horizontais */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribuicao} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="tipo" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="valor" name="Receita" radius={[0, 8, 8, 0]}>
                {distribuicao?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Serviço</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead className="text-right">Percentual</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distribuicao?.map((item) => {
                const ticketMedio = item.quantidade > 0 ? Number(item.valor) / item.quantidade : 0;
                return (
                  <TableRow key={item.tipo}>
                    <TableCell className="font-medium">{item.tipo}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {Number(item.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-center">{item.quantidade}</TableCell>
                    <TableCell className="text-right">{item.percentual.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      {ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
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
