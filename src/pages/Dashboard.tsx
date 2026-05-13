import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DashboardEvolucaoProcessosV2 } from "@/components/dashboard/DashboardEvolucaoProcessosV2";
import { DashboardPipelineLeadsCard } from "@/components/dashboard/DashboardPipelineLeadsCard";
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

  const processosAtivos = data?.processosAtivos || 0;
  const processosConcluidos = data?.processosConcluídosMes || 0;
  const leadsNoMes = data?.leadsNoMes || 0;
  const leadsParados = data?.leadsSemFollowUp || 0;
  const taxaConversao = data?.taxaConversaoMes || 0;
  const clientesAtivos = data?.clientesAtivos || 0;
  const clientesNovos = data?.clientesNovosMes || 0;

  const taxaConclusaoSemana =
    tarefas.totalAtivas + tarefas.concluidasSemana > 0
      ? Math.round((tarefas.concluidasSemana / (tarefas.totalAtivas + tarefas.concluidasSemana)) * 100)
      : 0;

  const totalAlertasUrgentes = tarefas.urgentes + prazos.atrasados;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-seasons text-primary">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{dataCapitalizada}</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-1.5">
            {totalAlertasUrgentes > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#A32D2D" }} />
                <p className="text-sm font-medium" style={{ color: "#A32D2D" }}>
                  {totalAlertasUrgentes} item{totalAlertasUrgentes > 1 ? "ns" : ""} urgente{totalAlertasUrgentes > 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">Tudo em dia</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Cards estratégicos — 4 colunas */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[130px] rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Processos */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-l-[3px]"
            style={{ borderLeftColor: "#378ADD" }}
            onClick={() => navigate("/dashboard/processos")}
          >
            <CardContent className="p-4 space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Processos ativos</p>
              <p className="text-3xl font-bold">{processosAtivos}</p>
              <p className="text-xs text-muted-foreground">{processosConcluidos} concluído{processosConcluidos !== 1 ? "s" : ""} este mês</p>
              <div className="flex items-center gap-1 text-xs text-primary pt-1">
                <span>Ver processos</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Tarefas */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-l-[3px]"
            style={{ borderLeftColor: tarefas.urgentes > 0 ? "#A32D2D" : "#3B6D11" }}
            onClick={() => navigate("/dashboard/processos/demandas")}
          >
            <CardContent className="p-4 space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Tarefas</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold">{tarefas.totalAtivas}</p>
                {tarefas.urgentes > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FCEBEB", color: "#A32D2D" }}>
                    {tarefas.urgentes} urgente{tarefas.urgentes > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{tarefas.concluidasSemana} concluída{tarefas.concluidasSemana !== 1 ? "s" : ""} na semana</span>
                  <span className="font-semibold" style={{ color: "#3B6D11" }}>{taxaConclusaoSemana}%</span>
                </div>
                <Progress value={taxaConclusaoSemana} className="h-1.5" />
              </div>
              <div className="flex items-center gap-1 text-xs text-primary pt-0.5">
                <span>Ver tarefas</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Prazos */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-l-[3px]"
            style={{ borderLeftColor: prazos.atrasados > 0 ? "#A32D2D" : "#3B6D11" }}
            onClick={() => navigate("/dashboard/processos/calendario")}
          >
            <CardContent className="p-4 space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Prazos</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold">{prazos.atrasados + prazos.hoje + prazos.estaSemana + prazos.dias30}</p>
                {prazos.atrasados > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FCEBEB", color: "#A32D2D" }}>
                    {prazos.atrasados} atrasado{prazos.atrasados > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {proximosPrazos.length > 0 ? (
                <div className="space-y-1.5">
                  {proximosPrazos.slice(0, 2).map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.dias_restantes <= 1 ? "#A32D2D" : p.dias_restantes <= 3 ? "#854F0B" : "#3B6D11" }}
                      />
                      <span className="text-[11px] text-muted-foreground truncate flex-1">{p.cliente_nome || "Processo"}</span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
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
              ) : (
                <p className="text-xs text-muted-foreground">{prazos.hoje} hoje, {prazos.estaSemana} esta semana</p>
              )}
              <div className="flex items-center gap-1 text-xs text-primary pt-0.5">
                <span>Calendário</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Leads */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-l-[3px]"
            style={{ borderLeftColor: "#3B6D11" }}
            onClick={() => navigate("/dashboard/leads")}
          >
            <CardContent className="p-4 space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Leads</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold">{leadsNoMes}</p>
                <span className="text-xs text-muted-foreground">este mês</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{clientesAtivos} clientes (+{clientesNovos} novo{clientesNovos !== 1 ? "s" : ""})</span>
                <span className="font-semibold" style={{ color: taxaConversao > 0 ? "#3B6D11" : undefined }}>
                  {taxaConversao}% conv.
                </span>
              </div>
              {leadsParados > 0 && (
                <p className="text-[11px] font-medium" style={{ color: "#854F0B" }}>
                  {leadsParados} parado{leadsParados > 1 ? "s" : ""} sem follow-up
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-primary pt-0.5">
                <span>Ver leads</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos: Pipeline + Evolução */}
      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardPipelineLeadsCard
          funil={data?.leadsFunil || { novo: 0, em_contato: 0, proposta: 0, perdido: 0 }}
          taxaConversao={taxaConversao}
          leadsParados={data?.leadsSemFollowUpList || []}
          loading={loading}
        />
        <DashboardEvolucaoProcessosV2
          data={evolucaoData?.meses || []}
          loading={evolucaoLoading}
        />
      </div>
    </div>
  );
}
