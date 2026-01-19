import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFluxoCaixa } from "@/hooks/useFinanceiro";
import { Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { chartColors } from "@/lib/chartConfig";

export function RelatorioFluxoCaixa() {
  const { data: fluxo, isLoading } = useFluxoCaixa();

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

  const totalEntradas = fluxo?.reduce((sum, f) => sum + Number(f.entradas), 0) || 0;
  const saldo = totalEntradas;

  const handleExportPDF = () => {
    exportToPDF(fluxo, "Relatório de Fluxo de Caixa");
  };

  const handleExportCSV = () => {
    exportToCSV(fluxo, "relatorio-fluxo-caixa");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Fluxo de Caixa Projetado</CardTitle>
            <CardDescription>Entradas previstas nos próximos 30 dias</CardDescription>
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
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Total de Entradas
              </CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {totalEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>A Receber</CardDescription>
              <CardTitle className="text-2xl">
                {totalEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Saldo Projetado</CardDescription>
              <CardTitle className={`text-2xl ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                {saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Gráfico de Linha */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fluxo}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="data" 
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => format(new Date(value), "dd/MM", { locale: ptBR })}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelFormatter={(value) => format(new Date(value), "dd 'de' MMMM", { locale: ptBR })}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="entradas" 
                name="Entradas Previstas" 
                stroke={chartColors.terracota} 
                strokeWidth={2}
                dot={{
                  fill: chartColors.terracota,
                  stroke: chartColors.terracota,
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  fill: chartColors.terracota,
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Entradas Previstas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fluxo?.map((item) => {
                return (
                  <TableRow key={item.data}>
                    <TableCell className="font-medium">
                      {format(new Date(item.data), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      {Number(item.entradas).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
