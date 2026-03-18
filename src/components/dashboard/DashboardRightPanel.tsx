import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import type { CargaAdvogada, StatusProcessos, ProcessoSemMovimentacao } from "@/hooks/useDashboardPrincipal";

interface Props {
  cargaAdvogadas: CargaAdvogada[];
  statusProcessos: StatusProcessos;
  processosSemMovimentacao: ProcessoSemMovimentacao[];
  totalSemMovimentacao: number;
  loading: boolean;
}

export function DashboardRightPanel({
  cargaAdvogadas,
  statusProcessos,
  processosSemMovimentacao,
  totalSemMovimentacao,
  loading,
}: Props) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const maxProcessos = Math.max(...cargaAdvogadas.map((a) => a.processos), 1);

  return (
    <div className="space-y-4">
      {/* Card 1 — Carga por advogada */}
      <Card className="border border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Carga por Advogada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cargaAdvogadas.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
          )}
          {cargaAdvogadas.map((adv) => (
            <div key={adv.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{adv.iniciais}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">{adv.nome.split(" ")[0]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{adv.processos} proc.</span>
                    {adv.prazosHoje > 0 && (
                      <Badge variant="outline" className="bg-[#FCEBEB] text-[hsl(0,60%,35%)] border-0 text-[10px] px-1.5">
                        {adv.prazosHoje} hoje
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(adv.processos / maxProcessos) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Card 2 — Status dos processos */}
      <Card className="border border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Status dos Processos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[hsl(210,80%,95%)] rounded-lg p-3 text-center">
              <p className="text-2xl font-seasons font-bold text-[hsl(210,70%,40%)]">{statusProcessos.emAndamento}</p>
              <p className="text-[10px] text-[hsl(210,50%,40%)] font-medium mt-0.5">Em andamento</p>
            </div>
            <div className="bg-[#EAF3DE] rounded-lg p-3 text-center">
              <p className="text-2xl font-seasons font-bold text-[hsl(100,40%,28%)]">{statusProcessos.concluidos}</p>
              <p className="text-[10px] text-[hsl(100,30%,30%)] font-medium mt-0.5">Concluídos</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-seasons font-bold text-muted-foreground">{statusProcessos.arquivados}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Arquivados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3 — Sem movimentação */}
      <Card className="border border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Sem Movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          {totalSemMovimentacao === 0 ? (
            <p className="text-sm text-muted-foreground">Todos os processos estão atualizados</p>
          ) : (
            <>
              <div className="bg-[#FAEEDA] rounded-lg px-3 py-2 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[hsl(38,70%,30%)]" />
                <span className="text-sm font-medium text-[hsl(38,70%,30%)]">
                  {totalSemMovimentacao} processo{totalSemMovimentacao > 1 ? "s" : ""} sem registro há 30+ dias
                </span>
              </div>
              <div className="space-y-2">
                {processosSemMovimentacao.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium truncate">
                      {p.numero_processo || `${p.autor || "?"} x ${p.reu || "?"}`}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {p.dias_sem_atualizacao >= 999 ? "Nunca" : `${p.dias_sem_atualizacao}d`}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/dashboard/processos")}
                className="text-xs text-primary hover:underline font-medium mt-2 block"
              >
                Ver todos
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
