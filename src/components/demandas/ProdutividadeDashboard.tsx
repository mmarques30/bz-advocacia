import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, TrendingUp, Trophy, AlertTriangle, Medal } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useProdutividadeEquipe, PeriodoFiltro } from "@/hooks/useProdutividadeEquipe";
import { TIPO_LABELS } from "@/types/demandas";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const COLORS = {
  concluidas: "hsl(var(--chart-2))",
  pendentes: "hsl(var(--chart-4))",
  emAndamento: "hsl(var(--chart-1))",
  total: "hsl(var(--chart-5))",
};

const MEDAL_MAP: Record<number, string> = {
  0: "🥇",
  1: "🥈",
  2: "🥉",
};

const PERIODO_LABELS: Record<PeriodoFiltro, string> = {
  este_mes: "Este Mês",
  "30d": "Últimos 30d",
  "90d": "Últimos 90d",
  todos: "Todos",
};

function useProfiles() {
  return useQuery({
    queryKey: ['profiles-ativos'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, nome_completo').eq('ativo', true).order('nome_completo');
      return data || [];
    },
  });
}

export function ProdutividadeDashboard() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('este_mes');
  const [responsavelId, setResponsavelId] = useState<string>('all');
  const [tipo, setTipo] = useState<string>('all');
  const { data: profiles } = useProfiles();
  const { data, isLoading } = useProdutividadeEquipe({
    periodo,
    responsavelId: responsavelId !== 'all' ? responsavelId : undefined,
    tipo: tipo !== 'all' ? tipo : undefined,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!data) return null;

  const totalPendentes = data.pendentesAprovacao.reduce((acc, g) => acc + g.total, 0);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PERIODO_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={responsavelId} onValueChange={setResponsavelId}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {profiles?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-[170px] h-9 text-sm">
            <SelectValue placeholder="Tipo de Tarefa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(TIPO_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={CheckCircle2} title="Concluídas" value={data.kpis.totalConcluidas} />
        <KPICard icon={Trophy} title="Top Executor" value={data.kpis.topExecutor} accent />
        <KPICard icon={Clock} title="Tempo Médio" value={`${data.kpis.tempoMedio}d`} />
        <KPICard icon={TrendingUp} title="Taxa Conclusão" value={`${data.kpis.taxaConclusao}%`} />
      </div>

      {/* Pendentes Aprovação das Advogadas */}
      {totalPendentes > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Pendentes Aprovação das Advogadas
              <Badge variant="secondary" className="ml-2 bg-amber-500/15 text-amber-700">
                {totalPendentes}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {data.pendentesAprovacao.map((grupo) => (
                <div key={grupo.advogada} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{grupo.advogada}</span>
                    <Badge variant="outline" className="text-xs">{grupo.total} tarefa{grupo.total > 1 ? 's' : ''}</Badge>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {grupo.demandas.slice(0, 5).map((d) => (
                      <div key={d.id} className="text-xs flex items-center gap-2 py-1 px-2 rounded bg-background/60">
                        <span className="text-muted-foreground">•</span>
                        <span className="truncate flex-1">{d.titulo}</span>
                        <span className="text-muted-foreground shrink-0">({d.responsavel_nome})</span>
                        {d.data_limite && (
                          <span className="text-muted-foreground shrink-0 text-[10px]">
                            até {new Date(d.data_limite).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    ))}
                    {grupo.demandas.length > 5 && (
                      <p className="text-xs text-muted-foreground pl-2">
                        +{grupo.demandas.length - 5} mais...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranking por Executor com Medalhas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Medal className="h-5 w-5 text-amber-500" />
            Ranking por Executor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.rankingExecutores.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado no período</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-center">Concluídas</TableHead>
                  <TableHead className="text-center">Pendentes</TableHead>
                  <TableHead className="text-center">Em And.</TableHead>
                  <TableHead className="text-center">Tempo Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rankingExecutores.map((exec, i) => (
                  <TableRow key={i} className={i < 3 ? "bg-accent/30" : ""}>
                    <TableCell className="text-center text-lg">
                      {MEDAL_MAP[i] || `${i + 1}º`}
                    </TableCell>
                    <TableCell className="font-medium">{exec.nome}</TableCell>
                    <TableCell className="text-center font-semibold">{exec.concluidas}</TableCell>
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

      {/* Volume de Trabalho Mensal — ComposedChart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Volume de Trabalho Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.evolucaoMensal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="concluidas" name="Concluídas" stackId="a" fill={COLORS.concluidas} radius={[0, 0, 0, 0]} />
              <Bar dataKey="emAndamento" name="Em Andamento" stackId="a" fill={COLORS.emAndamento} />
              <Bar dataKey="pendentes" name="Pendentes" stackId="a" fill={COLORS.pendentes} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="total" name="Total" stroke={COLORS.total} strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, title, value, accent }: { icon: React.ElementType; title: string; value: string | number; accent?: boolean }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-4 w-4 ${accent ? 'text-amber-500' : 'text-muted-foreground'}`} />
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
