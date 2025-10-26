import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReceitaMensal } from "@/hooks/useFinanceiro";
import { Download, FileText, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { chartColors } from "@/lib/chartConfig";

interface RelatorioReceitasPeriodoProps {
  dataInicio: Date;
  dataFim: Date;
}

export function RelatorioReceitasPeriodo({ dataInicio, dataFim }: RelatorioReceitasPeriodoProps) {
  const { data: receitas, isLoading } = useReceitaMensal(12);

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

  const total = receitas?.reduce((sum, r) => sum + Number(r.receita), 0) || 0;
  const media = receitas && receitas.length > 0 ? total / receitas.length : 0;
  const crescimento = receitas && receitas.length >= 2
    ? ((Number(receitas[receitas.length - 1].receita) - Number(receitas[0].receita)) / Number(receitas[0].receita)) * 100
    : 0;

  const handleExportPDF = () => {
    exportToPDF(receitas, "Relatório de Receitas do Período");
  };

  const handleExportCSV = () => {
    exportToCSV(receitas, "relatorio-receitas");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Receitas do Período</CardTitle>
            <CardDescription>
              {format(dataInicio, "dd 'de' MMMM", { locale: ptBR })} até {format(dataFim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
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
                {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Média Mensal</CardDescription>
              <CardTitle className="text-2xl">
                {media.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Crescimento</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className={crescimento >= 0 ? "text-green-600" : "text-red-600"} />
                {crescimento.toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Gráfico */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={receitas}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="receita" name="Receita" fill={chartColors.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receitas?.map((receita, index) => {
                const anterior = index > 0 ? Number(receitas[index - 1].receita) : null;
                const variacao = anterior ? ((Number(receita.receita) - anterior) / anterior) * 100 : null;
                
                return (
                  <TableRow key={receita.mes}>
                    <TableCell className="font-medium">{receita.mes}</TableCell>
                    <TableCell className="text-right">
                      {Number(receita.receita).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-right">
                      {variacao !== null ? (
                        <span className={variacao >= 0 ? "text-green-600" : "text-red-600"}>
                          {variacao > 0 ? "+" : ""}{variacao.toFixed(1)}%
                        </span>
                      ) : "-"}
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
