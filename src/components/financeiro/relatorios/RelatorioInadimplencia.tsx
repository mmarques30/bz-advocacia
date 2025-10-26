import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClientesInadimplentes } from "@/hooks/useFinanceiro";
import { Download, FileText, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { chartColors } from "@/lib/chartConfig";

export function RelatorioInadimplencia() {
  const { data: inadimplentes, isLoading } = useClientesInadimplentes();

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

  const totalAtrasado = inadimplentes?.reduce((sum, c) => sum + Number(c.total_atrasado), 0) || 0;
  const totalClientes = inadimplentes?.length || 0;
  const totalParcelas = inadimplentes?.reduce((sum, c) => sum + c.parcelas_atrasadas, 0) || 0;

  const chartData = inadimplentes?.slice(0, 5).map((cliente) => ({
    name: cliente.cliente_nome,
    value: Number(cliente.total_atrasado),
  })) || [];

  const COLORS = [chartColors.danger, chartColors.warning, chartColors.accent, chartColors.muted, chartColors.secondary];

  const handleExportPDF = () => {
    exportToPDF(inadimplentes, "Relatório de Inadimplência");
  };

  const handleExportCSV = () => {
    exportToCSV(inadimplentes, "relatorio-inadimplencia");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              Relatório de Inadimplência
            </CardTitle>
            <CardDescription>Clientes e valores em atraso</CardDescription>
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
              <CardDescription>Total Atrasado</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {totalAtrasado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Clientes Inadimplentes</CardDescription>
              <CardTitle className="text-2xl">{totalClientes}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Parcelas Atrasadas</CardDescription>
              <CardTitle className="text-2xl">{totalParcelas}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Gráfico de Pizza */}
        {chartData.length > 0 && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${(entry.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabela de Inadimplentes */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor Atrasado</TableHead>
                <TableHead className="text-center">Parcelas</TableHead>
                <TableHead className="text-center">Maior Atraso (dias)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inadimplentes?.map((cliente) => (
                <TableRow key={cliente.cliente_id}>
                  <TableCell className="font-medium">{cliente.cliente_nome}</TableCell>
                  <TableCell className="text-right text-red-600 font-semibold">
                    {Number(cliente.total_atrasado).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell className="text-center">{cliente.parcelas_atrasadas}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold">{cliente.maior_atraso_dias}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
