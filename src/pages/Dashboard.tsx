import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardKPICard } from "@/components/dashboard/DashboardKPICard";
import { DashboardPrazosPanel } from "@/components/dashboard/DashboardPrazosPanel";
import { DashboardRightPanel } from "@/components/dashboard/DashboardRightPanel";
import { ProcessoDetailsDialog } from "@/components/processos/ProcessoDetailsDialog";
import { useDashboardPrincipal } from "@/hooks/useDashboardPrincipal";
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
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null);

  const userName = profile?.nome_completo || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const hoje = new Date();
  const dataFormatada = format(hoje, "EEEE, d 'de' MMMM", { locale: ptBR });
  // Capitalize first letter
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

  const prazosHojeCount = data?.prazosHojeCount || 0;
  const prazosAtrasados = data?.prazosUrgencia.atrasados || 0;

  return (
    <div className="space-y-6">
      {/* Saudação + Data */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
        <div>
          <h1 className="text-3xl md:text-4xl font-seasons text-primary">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-base text-muted-foreground mt-1">Aqui está o resumo do seu escritório</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{dataCapitalizada}</p>
          <p className="text-xs text-muted-foreground">
            {prazosHojeCount > 0
              ? `${prazosHojeCount} prazo${prazosHojeCount > 1 ? "s" : ""} vence${prazosHojeCount > 1 ? "m" : ""} hoje`
              : "Nenhum prazo para hoje"}
            {prazosAtrasados > 0 && ` · ${prazosAtrasados} atrasado${prazosAtrasados > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <DashboardKPICard
          title="Processos Ativos"
          value={data?.statusProcessos.emAndamento || 0}
          barColor="bg-[hsl(210,70%,50%)]"
          loading={isLoading}
        />
        <DashboardKPICard
          title="Prazos Hoje"
          value={prazosHojeCount}
          barColor="bg-destructive"
          subtitle={prazosAtrasados > 0 ? `+ ${prazosAtrasados} atrasado${prazosAtrasados > 1 ? "s" : ""}` : undefined}
          loading={isLoading}
        />
        <DashboardKPICard
          title="Sem Atualização"
          value={data?.totalSemMovimentacao || 0}
          barColor="bg-[hsl(38,92%,50%)]"
          loading={isLoading}
        />
        <DashboardKPICard
          title="Esta Semana"
          value={data?.prazosUrgencia.estaSemana || 0}
          barColor="bg-[hsl(142,76%,36%)]"
          loading={isLoading}
        />
      </div>

      {/* Main panels */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DashboardPrazosPanel
            urgencia={data?.prazosUrgencia || { atrasados: 0, hoje: 0, estaSemana: 0, trintaDias: 0 }}
            distribuicao={data?.prazosTipoDistribuicao || []}
            proximosPrazos={data?.proximosPrazos || []}
            loading={isLoading}
            onPrazoClick={(id) => setSelectedProcessoId(id)}
          />
        </div>
        <div className="lg:col-span-2">
          <DashboardRightPanel
            cargaAdvogadas={data?.cargaAdvogadas || []}
            statusProcessos={data?.statusProcessos || { emAndamento: 0, concluidos: 0, arquivados: 0 }}
            processosSemMovimentacao={data?.processosSemMovimentacao || []}
            totalSemMovimentacao={data?.totalSemMovimentacao || 0}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Processo details dialog */}
      <ProcessoDetailsDialog
        processoId={selectedProcessoId}
        open={!!selectedProcessoId}
        onClose={() => setSelectedProcessoId(null)}
      />
    </div>
  );
}
