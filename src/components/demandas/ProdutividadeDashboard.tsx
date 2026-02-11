import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, TrendingUp, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useProdutividadeEquipe, PeriodoFiltro } from "@/hooks/useProdutividadeEquipe";

const COLORS = {
  concluidas: "hsl(var(--chart-2))",
  pendentes: "hsl(var(--chart-4))",
  emAndamento: "hsl(var(--chart-1))",
};

export function ProdutividadeDashboard() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('este_mes');
  const { data, isLoading } = useProdutividadeEquipe(periodo);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
        <TabsList>
          <TabsTrigger value="este_mes">Este Mês</TabsTrigger>
          <TabsTrigger value="30d">Últimos 30d</TabsTrigger>
          <TabsTrigger value="90d">Últimos 90d</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={CheckCircle2} title="Concluídas" value={data.kpis.totalConcluidas} />
        <KPICard icon={Trophy} title="Top Executor" value={data.kpis.topExecutor} />
        <KPICard icon={Clock} title="Tempo Médio" value={`${data.kpis.tempoMedio}d`} />
        <KPICard icon={TrendingUp} title="Taxa Conclusão" value={`${data.kpis.taxaConclusao}%`} />
      </div>

      {/* Ranking + Distribuição */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ranking por Executor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ranking por Executor</CardTitle>
          </CardHeader>
          <CardContent>
            {data.rankingExecutores.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado no período</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center">Concluídas</TableHead>
                    <TableHead className="text-center">Pendentes</TableHead>
                    <TableHead className="text-center">Em And.</TableHead>
                    <TableHead className="text-center">Tempo Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rankingExecutores.map((exec, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{exec.nome}</TableCell>
                      <TableCell className="text-center">{exec.concluidas}</TableCell>
                      <TableCell className="text-center">{exec.pendentes}</TableCell>
                      <TableCell className="text-center">{exec.emAndamento}</TableCell>
                      <TableCell className="text-center">{exec.tempoMedio}d</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de Carga */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribuição de Carga</CardTitle>
          </CardHeader>
          <CardContent>
            {data.distribuicaoCarga.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado no período</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.distribuicaoCarga} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nome" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="concluidas" name="Concluídas" stackId="a" fill={COLORS.concluidas} />
                  <Bar dataKey="emAndamento" name="Em Andamento" stackId="a" fill={COLORS.emAndamento} />
                  <Bar dataKey="pendentes" name="Pendentes" stackId="a" fill={COLORS.pendentes} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Por Advogada + Evolução */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Por Advogada Responsável */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Por Advogada Responsável</CardTitle>
          </CardHeader>
          <CardContent>
            {data.porAdvogada.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.porAdvogada}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="advogada" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="concluidas" name="Concluídas" fill={COLORS.concluidas} />
                  <Bar dataKey="emAndamento" name="Em Andamento" fill={COLORS.emAndamento} />
                  <Bar dataKey="pendentes" name="Pendentes" fill={COLORS.pendentes} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Evolução Mensal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="concluidas" name="Concluídas" fill={COLORS.concluidas} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, title, value }: { icon: React.ElementType; title: string; value: string | number }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
