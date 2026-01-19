import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Phone, Clock, UserCheck, UserX } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { chartColors } from "@/lib/chartConfig";
import { useRelatoriosVendasPeriodo } from "@/hooks/useRelatoriosVendasPeriodo";
import { Progress } from "@/components/ui/progress";

interface RelatorioPerformanceContatoProps {
  dataInicio: Date;
  dataFim: Date;
}

export function RelatorioPerformanceContato({ dataInicio, dataFim }: RelatorioPerformanceContatoProps) {
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

  const contato = data?.contato;
  const leads = data?.leads || [];

  const chartData = [
    { name: 'Contatados', value: contato?.leadsContatados || 0, fill: chartColors.primary },
    { name: 'Sem Contato', value: contato?.leadsSemContato || 0, fill: chartColors.muted },
  ];

  const exportData = [
    {
      Métrica: "Total de Leads",
      Valor: contato?.totalLeads,
    },
    {
      Métrica: "Leads Contatados",
      Valor: contato?.leadsContatados,
    },
    {
      Métrica: "Leads Sem Contato",
      Valor: contato?.leadsSemContato,
    },
    {
      Métrica: "Taxa de Contato (%)",
      Valor: contato?.taxaContato.toFixed(1),
    },
    {
      Métrica: "Tempo Médio de Resposta (dias)",
      Valor: contato?.tempoMedioResposta || "N/A",
    },
  ];

  const handleExportPDF = () => {
    exportToPDF(exportData, "Relatório Performance de Contato");
  };

  const handleExportCSV = () => {
    exportToCSV(exportData, "relatorio-performance-contato");
  };

  // Leads sem contato (para a tabela)
  const leadsSemContato = leads.filter(l => !l.primeiro_contato_em).slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Performance de Contato</CardTitle>
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
                <UserCheck className="h-4 w-4" />
                Taxa de Contato
              </CardDescription>
              <CardTitle className="text-2xl">{contato?.taxaContato.toFixed(1)}%</CardTitle>
              <Progress value={contato?.taxaContato || 0} className="h-2 mt-2" />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tempo Médio Resposta
              </CardDescription>
              <CardTitle className="text-2xl">
                {contato?.tempoMedioResposta !== null ? `${contato?.tempoMedioResposta} dias` : "N/A"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                Leads Contatados
              </CardDescription>
              <CardTitle className="text-2xl text-green-600">{contato?.leadsContatados}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-amber-600" />
                Leads Sem Contato
              </CardDescription>
              <CardTitle className="text-2xl text-amber-600">{contato?.leadsSemContato}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Gráfico */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" name="Quantidade">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Métricas detalhadas */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Leads Contatados</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{contato?.leadsContatados}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {contato?.taxaContato.toFixed(1)}% do total de leads
              </div>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-amber-600" />
                  <span className="font-medium">Aguardando Contato</span>
                </div>
                <span className="text-2xl font-bold text-amber-600">{contato?.leadsSemContato}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {(100 - (contato?.taxaContato || 0)).toFixed(1)}% precisam de atenção
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de leads sem contato */}
        {leadsSemContato.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mt-4">Leads Aguardando Contato</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo Processo</TableHead>
                    <TableHead>Data Entrada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadsSemContato.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.nome_completo}</TableCell>
                      <TableCell>{lead.telefone}</TableCell>
                      <TableCell>{lead.tipo_processo}</TableCell>
                      <TableCell>
                        {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
