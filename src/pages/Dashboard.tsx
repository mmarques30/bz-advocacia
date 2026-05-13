import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Scale,
  ListChecks,
  Clock,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { DashboardCargaEquipeCard } from "@/components/dashboard/DashboardCargaEquipeCard";
import { useDashboardPrincipal } from "@/hooks/useDashboardPrincipal";
import { useDashboardVisual } from "@/hooks/useDashboardVisual";
import { useProcessosEvolucao } from "@/hooks/useProcessosEvolucao";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const COLORS_DONUT = [
  { key: "urgentes", label: "Urgentes", color: "#A32D2D" },
  { key: "atrasadas", label: "Atrasadas", color: "#854F0B" },
  { key: "pendentes", label: "Pendentes", color: "#378ADD" },
  { key: "concluidasSemana", label: "Concluídas", color: "#3B6D11" },
];

const PIPELINE_STAGES = [
  { key: "novo" as const, label: "Novo", color: "#378ADD" },
  { key: "em_contato" as const, label: "Em contato", color: "#3B6D11" },
  { key: "proposta" as const, label: "Proposta", color: "#854F0B" },
  { key: "perdido" as const, label: "Perdido", color: "#A32D2D" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data, isLoading } = useDashboardPrincipal();
  const { data: visual, isLoading: visualLoading } = useDashboardVisual();
  const { data: evolucaoData, isLoading: evolucaoLoading } = useProcessosEvolucao();
  const navigate = useNavigate();

  const userName =
    profile?.nome_completo?.split(" ")[0] ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "";
  const hoje = new Date();
  const dataFormatada = format(hoje, "EEEE, d 'de' MMMM", { locale: ptBR });
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

  const loading = isLoading || visualLoading;

  const tarefas = visual?.tarefas || { urgentes: 0, atrasadas: 0, concluidasSemana: 0, pendentes: 0, totalAtivas: 0 };
  const prazos = visual?.prazos || { atrasados: 0, hoje: 0, estaSemana: 0, dias30: 0 };
  const proximosPrazos = visual?.proximosPrazos || [];
  const heatmap = visual?.heatmap || [];

  const processosAtivos = data?.processosAtivos || 0;
  const processosConcluidos = data?.processosConcluídosMes || 0;
  const leadsNoMes = data?.leadsNoMes || 0;
  const leadsParados = data?.leadsSemFollowUp || 0;
  const taxaConversao = data?.taxaConversaoMes || 0;
  const clientesAtivos = data?.clientesAtivos || 0;
  const clientesNovos = data?.clientesNovosMes || 0;
  const funil = data?.leadsFunil || { novo: 0, em_contato: 0, proposta: 0, perdido: 0 };
  const leadsParadosList = data?.leadsSemFollowUpList || [];

  const totalPrazos = prazos.atrasados + prazos.hoje + prazos.estaSemana + prazos.dias30;
  const totalTarefas = tarefas.totalAtivas + tarefas.concluidasSemana;
  const taxaConclusao = totalTarefas > 0 ? Math.round((tarefas.concluidasSemana / totalTarefas) * 100) : 0;

  const donutData = COLORS_DONUT.map((c) => ({
    name: c.label,
    value: tarefas[c.key as keyof typeof tarefas] as number,
    color: c.color,
  })).filter((d) => d.value > 0);

  const funilMax = Math.max(funil.novo, funil.em_contato, funil.proposta, funil.perdido, 1);

  const kpis = [
    {
      icon: Scale,
      label: "Processos ativos",
      value: processosAtivos,
      sub: `${processosConcluidos} concluído${processosConcluidos !== 1 ? "s" : ""} no mês`,
      accent: "#378ADD",
      href: "/dashboard/processos",
    },
    {
      icon: ListChecks,
      label: "Tarefas",
      value: tarefas.totalAtivas,
      sub: tarefas.urgentes > 0
        ? `${tarefas.urgentes} urgente${tarefas.urgentes > 1 ? "s" : ""} · ${tarefas.atrasadas} atrasada${tarefas.atrasadas > 1 ? "s" : ""}`
        : `${tarefas.concluidasSemana} concluída${tarefas.concluidasSemana !== 1 ? "s" : ""} esta semana`,
      accent: tarefas.urgentes > 0 ? "#A32D2D" : "#3B6D11",
      href: "/dashboard/processos/demandas",
    },
    {
      icon: Clock,
      label: "Prazos",
      value: totalPrazos,
      sub: prazos.atrasados > 0
        ? `${prazos.atrasados} atrasado${prazos.atrasados > 1 ? "s" : ""} · ${prazos.hoje} hoje`
        : `${prazos.hoje} hoje · ${prazos.estaSemana} esta semana`,
      accent: prazos.atrasados > 0 ? "#A32D2D" : "#3B6D11",
      href: "/dashboard/processos/calendario",
    },
    {
      icon: Users,
      label: "Leads",
      value: leadsNoMes,
      sub: `${taxaConversao}% conversão · ${clientesAtivos} clientes (+${clientesNovos})`,
      accent: "#3B6D11",
      href: "/dashboard/leads",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-seasons text-primary">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{dataCapitalizada}</p>
        </div>
      </div>

      {/* Row 1: 4 KPI cards */}
      {loading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <button
              key={kpi.label}
              onClick={() => navigate(kpi.href)}
              className="text-left group"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4 flex gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: kpi.accent + "18" }}
                  >
                    <kpi.icon className="w-5 h-5" style={{ color: kpi.accent }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                    <p className="text-2xl font-bold leading-tight">{kpi.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{kpi.sub}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Row 2: Donut tarefas (1/3) + Evolução mensal (2/3) */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Donut: distribuição de tarefas */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">Tarefas da semana</CardTitle>
              <button
                onClick={() => navigate("/dashboard/processos/demandas")}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Abrir <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : donutData.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                Sem tarefas
              </div>
            ) : (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {donutData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold">{totalTarefas}</span>
                    <span className="text-[10px] text-muted-foreground">total</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                  {COLORS_DONUT.map((c) => {
                    const val = tarefas[c.key as keyof typeof tarefas] as number;
                    return (
                      <div key={c.key} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-[11px] text-muted-foreground flex-1">{c.label}</span>
                        <span className="text-[11px] font-semibold">{val}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Conclusão semanal</span>
                    <span className="font-semibold" style={{ color: "#3B6D11" }}>{taxaConclusao}%</span>
                  </div>
                  <Progress value={taxaConclusao} className="h-1.5" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Evolução mensal — 2 colunas */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">Evolução mensal de processos</CardTitle>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#3B6D11" }} />
                  <span className="text-muted-foreground">Abertos</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#A32D2D" }} />
                  <span className="text-muted-foreground">Concluídos</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {evolucaoLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={evolucaoData?.meses || []} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickCount={5} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="abertos" fill="#3B6D11" radius={[3, 3, 0, 0]} name="Abertos" />
                  <Bar dataKey="concluidos" fill="#A32D2D" radius={[3, 3, 0, 0]} name="Concluídos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Pipeline (1/2) + Carga equipe (1/2) */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Pipeline inline */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">Pipeline de leads</CardTitle>
              <button
                onClick={() => navigate("/dashboard/leads")}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Ver leads <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : (
              <>
                <div className="space-y-2">
                  {PIPELINE_STAGES.map((s) => {
                    const val = funil[s.key];
                    const width = Math.max((val / funilMax) * 100, val > 0 ? 12 : 0);
                    return (
                      <div key={s.key} className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground w-16 text-right">{s.label}</span>
                        <div className="relative flex-1 h-6 rounded-md overflow-hidden" style={{ backgroundColor: "hsl(var(--muted))" }}>
                          <div
                            className="h-full rounded-md flex items-center justify-center text-[11px] font-bold text-white transition-all"
                            style={{ width: `${width}%`, backgroundColor: val > 0 ? s.color : "transparent", minWidth: val > 0 ? 28 : 0 }}
                          >
                            {val > 0 && val}
                          </div>
                          {val === 0 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-muted-foreground">0</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Conversão do mês</span>
                    <span className="font-semibold" style={{ color: "#3B6D11" }}>{taxaConversao}%</span>
                  </div>
                  <Progress value={taxaConversao} className="h-1.5" />
                </div>
                {leadsParadosList.length > 0 && (
                  <div className="rounded-lg p-2 flex items-start gap-2" style={{ backgroundColor: "#FAEEDA" }}>
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#854F0B" }} />
                    <div className="text-[11px]" style={{ color: "#854F0B" }}>
                      <span className="font-semibold">{leadsParadosList[0].nome}</span> parado há {leadsParadosList[0].dias_parado} dias
                      {leadsParadosList.length > 1 && ` (+${leadsParadosList.length - 1} outros)`}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Carga da equipe */}
        <DashboardCargaEquipeCard data={heatmap} loading={loading} />
      </div>

      {/* Row 4: Prazos processuais — full width */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">Prazos processuais</CardTitle>
            <button
              onClick={() => navigate("/dashboard/processos/calendario")}
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              Calendário <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Badges resumo */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Atrasados", value: prazos.atrasados, bg: "#FCEBEB", color: "#A32D2D" },
                  { label: "Hoje", value: prazos.hoje, bg: "#FAEEDA", color: "#854F0B" },
                  { label: "Esta semana", value: prazos.estaSemana, bg: "#EAF3DE", color: "#3B6D11" },
                  { label: "30 dias", value: prazos.dias30, bg: "hsl(var(--muted))", color: "hsl(var(--foreground))" },
                ].map((b) => (
                  <button
                    key={b.label}
                    onClick={() => navigate("/dashboard/processos/calendario")}
                    className="rounded-lg px-4 py-2.5 text-center transition-colors hover:opacity-80 min-w-[90px]"
                    style={{ backgroundColor: b.value > 0 ? b.bg : "hsl(var(--muted))" }}
                  >
                    <p className="text-xl font-bold" style={{ color: b.value > 0 ? b.color : "hsl(var(--foreground))" }}>
                      {b.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{b.label}</p>
                  </button>
                ))}
              </div>

              {/* Timeline próximos prazos */}
              {proximosPrazos.length > 0 && (
                <div className="flex-1 border-l-2 border-border pl-4 space-y-2.5">
                  {proximosPrazos.map((p) => (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: p.dias_restantes <= 1 ? "#A32D2D" : p.dias_restantes <= 3 ? "#854F0B" : "#3B6D11",
                        }}
                      />
                      <span className="text-xs font-medium truncate max-w-[140px]">{p.cliente_nome || "Processo"}</span>
                      <span className="text-[11px] text-muted-foreground truncate flex-1">{p.descricao}</span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          backgroundColor: p.dias_restantes <= 1 ? "#FCEBEB" : p.dias_restantes <= 3 ? "#FAEEDA" : "#EAF3DE",
                          color: p.dias_restantes <= 1 ? "#A32D2D" : p.dias_restantes <= 3 ? "#854F0B" : "#3B6D11",
                        }}
                      >
                        {p.dias_restantes}d
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
