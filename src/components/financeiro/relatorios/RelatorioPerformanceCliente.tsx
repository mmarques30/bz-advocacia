import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMaioresPagadores } from "@/hooks/useFinanceiro";
import { Download, FileText, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { chartColors } from "@/lib/chartConfig";

export function RelatorioPerformanceCliente() {
  const { data: maioresPagadores, isLoading } = useMaioresPagadores(10);

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

  const totalPago = maioresPagadores?.reduce((sum, c) => sum + Number(c.total_pago), 0) || 0;
  const totalClientes = maioresPagadores?.length || 0;
  const mediaPorCliente = totalClientes > 0 ? totalPago / totalClientes : 0;

  const handleExportPDF = () => {
    exportToPDF(maioresPagadores, "Relatório de Performance por Cliente");
  };

  const handleExportCSV = () => {
    exportToCSV(maioresPagadores, "relatorio-performance-cliente");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              Performance por Cliente
            </CardTitle>
            <CardDescription>Top 10 maiores pagadores do mês</CardDescription>
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
              <CardDescription>Total Recebido</CardDescription>
              <CardTitle className="text-2xl">
                {totalPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Top Clientes</CardDescription>
              <CardTitle className="text-2xl">{totalClientes}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Média por Cliente</CardDescription>
              <CardTitle className="text-2xl">
                {mediaPorCliente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Gráfico de Barras */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maioresPagadores}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="cliente_nome" 
                stroke="hsl(var(--muted-foreground))"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="total_pago" name="Total Pago" fill={chartColors.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela de Ranking */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total Pago</TableHead>
                <TableHead className="text-center">Pagamentos</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maioresPagadores?.map((cliente, index) => {
                const ticketMedio = cliente.quantidade_pagamentos > 0 
                  ? Number(cliente.total_pago) / cliente.quantidade_pagamentos 
                  : 0;
                
                return (
                  <TableRow key={cliente.cliente_id}>
                    <TableCell className="font-bold text-center">
                      {index === 0 && <Trophy className="h-4 w-4 inline mr-1 text-yellow-600" />}
                      {index + 1}º
                    </TableCell>
                    <TableCell className="font-medium">{cliente.cliente_nome}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {Number(cliente.total_pago).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-center">{cliente.quantidade_pagamentos}</TableCell>
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
