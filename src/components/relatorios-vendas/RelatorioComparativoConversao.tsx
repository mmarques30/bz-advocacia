import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, TrendingUp, TrendingDown, Users, UserCheck, UserPlus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { chartColors } from "@/lib/chartConfig";
import { useRelatoriosVendasPeriodo } from "@/hooks/useRelatoriosVendasPeriodo";

interface RelatorioComparativoConversaoProps {
  dataInicio: Date;
  dataFim: Date;
}

export function RelatorioComparativoConversao({ dataInicio, dataFim }: RelatorioComparativoConversaoProps) {
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

  const comparativo = data?.comparativo;
  const chartData = [
    {
      metrica: "Total Leads",
      atual: comparativo?.periodoAtual.totalLeads || 0,
      anterior: comparativo?.periodoAnterior.totalLeads || 0,
    },
    {
      metrica: "Contatados",
      atual: comparativo?.periodoAtual.leadsContatados || 0,
      anterior: comparativo?.periodoAnterior.leadsContatados || 0,
    },
    {
      metrica: "Convertidos",
      atual: comparativo?.periodoAtual.leadsConvertidos || 0,
      anterior: comparativo?.periodoAnterior.leadsConvertidos || 0,
    },
  ];

  const exportData = [
    {
      Métrica: "Total de Leads",
      "Período Atual": comparativo?.periodoAtual.totalLeads,
      "Período Anterior": comparativo?.periodoAnterior.totalLeads,
      "Variação (%)": comparativo?.variacaoLeads.toFixed(1),
    },
    {
      Métrica: "Leads Contatados",
      "Período Atual": comparativo?.periodoAtual.leadsContatados,
      "Período Anterior": comparativo?.periodoAnterior.leadsContatados,
      "Variação (%)": comparativo?.variacaoContato.toFixed(1),
    },
    {
      Métrica: "Leads Convertidos",
      "Período Atual": comparativo?.periodoAtual.leadsConvertidos,
      "Período Anterior": comparativo?.periodoAnterior.leadsConvertidos,
      "Variação (%)": comparativo?.variacaoConversao.toFixed(1),
    },
    {
      Métrica: "Taxa de Conversão (%)",
      "Período Atual": comparativo?.periodoAtual.taxaConversao.toFixed(1),
      "Período Anterior": comparativo?.periodoAnterior.taxaConversao.toFixed(1),
      "Variação (pp)": comparativo?.variacaoConversao.toFixed(1),
    },
  ];

  const handleExportPDF = () => {
    exportToPDF(exportData, "Relatório Comparativo de Conversão");
  };

  const handleExportCSV = () => {
    exportToCSV(exportData, "relatorio-comparativo-conversao");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Comparativo de Conversão</CardTitle>
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Leads
              </CardDescription>
              <CardTitle className="text-2xl">
                {comparativo?.periodoAtual.totalLeads || 0}
              </CardTitle>
              <div className={`text-sm flex items-center gap-1 ${(comparativo?.variacaoLeads || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(comparativo?.variacaoLeads || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {(comparativo?.variacaoLeads || 0).toFixed(1)}% vs período anterior
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Leads Contatados
              </CardDescription>
              <CardTitle className="text-2xl">
                {comparativo?.periodoAtual.leadsContatados || 0}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {comparativo?.periodoAtual.taxaContato.toFixed(1)}% do total
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Leads Convertidos
              </CardDescription>
              <CardTitle className="text-2xl">
                {comparativo?.periodoAtual.leadsConvertidos || 0}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {comparativo?.periodoAtual.taxaConversao.toFixed(1)}% de conversão
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Valor Propostas</CardDescription>
              <CardTitle className="text-2xl">
                {(comparativo?.periodoAtual.valorTotalPropostas || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Gráfico */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="metrica" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="atual" name="Período Atual" fill={chartColors.primary} />
              <Bar dataKey="anterior" name="Período Anterior" fill={chartColors.secondary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Métrica</TableHead>
                <TableHead className="text-right">Período Atual</TableHead>
                <TableHead className="text-right">Período Anterior</TableHead>
                <TableHead className="text-right">Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total de Leads</TableCell>
                <TableCell className="text-right">{comparativo?.periodoAtual.totalLeads}</TableCell>
                <TableCell className="text-right">{comparativo?.periodoAnterior.totalLeads}</TableCell>
                <TableCell className="text-right">
                  <span className={(comparativo?.variacaoLeads || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                    {(comparativo?.variacaoLeads || 0) > 0 ? "+" : ""}{(comparativo?.variacaoLeads || 0).toFixed(1)}%
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Taxa de Contato</TableCell>
                <TableCell className="text-right">{comparativo?.periodoAtual.taxaContato.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{comparativo?.periodoAnterior.taxaContato.toFixed(1)}%</TableCell>
                <TableCell className="text-right">
                  <span className={(comparativo?.variacaoContato || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                    {(comparativo?.variacaoContato || 0) > 0 ? "+" : ""}{(comparativo?.variacaoContato || 0).toFixed(1)}pp
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Taxa de Conversão</TableCell>
                <TableCell className="text-right">{comparativo?.periodoAtual.taxaConversao.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{comparativo?.periodoAnterior.taxaConversao.toFixed(1)}%</TableCell>
                <TableCell className="text-right">
                  <span className={(comparativo?.variacaoConversao || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                    {(comparativo?.variacaoConversao || 0) > 0 ? "+" : ""}{(comparativo?.variacaoConversao || 0).toFixed(1)}pp
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Valor Total Propostas</TableCell>
                <TableCell className="text-right">
                  {(comparativo?.periodoAtual.valorTotalPropostas || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell className="text-right">
                  {(comparativo?.periodoAnterior.valorTotalPropostas || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell className="text-right">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
