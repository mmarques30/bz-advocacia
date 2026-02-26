import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Scale,
  ArrowRight,
  Calendar,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ProcessoDetailsDialog } from "@/components/processos/ProcessoDetailsDialog";
import type {
  ProcessosPorStatus,
  PrazoProximo,
  ProcessoSemAtualizacao,
} from "@/hooks/useDashboardCompleto";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VisaoOperacionalProps {
  processos: ProcessosPorStatus;
  proximosPrazos: PrazoProximo[];
  processosSemAtualizacao: ProcessoSemAtualizacao[];
  loading?: boolean;
}

function ProcessosPrazosCard({
  processos,
  proximosPrazos,
  processosSemAtualizacao,
  loading,
  onOpenProcesso,
}: {
  processos: ProcessosPorStatus;
  proximosPrazos: PrazoProximo[];
  processosSemAtualizacao: ProcessoSemAtualizacao[];
  loading?: boolean;
  onOpenProcesso: (id: string) => void;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Processos e Prazos</CardTitle>
          </div>
          <Link
            to="/dashboard/processos"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Em andamento: {processos.emAndamento}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
            <span className="h-2 w-2 rounded-full bg-chart-4" />
            Concluídos: {processos.concluidos}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            Arquivados: {processos.arquivados}
          </Badge>
        </div>

        {/* Próximos prazos */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Próximos Prazos
          </h4>
          {proximosPrazos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum prazo nos próximos 14 dias
            </p>
          ) : (
            <div className="space-y-2">
              {proximosPrazos.slice(0, 5).map((prazo) => (
                <div
                  key={prazo.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{prazo.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {prazo.numero_processo || "Sem número"} · {prazo.tipo_prazo}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge
                      variant={prazo.dias_restantes <= 3 ? "destructive" : "secondary"}
                      className="text-xs whitespace-nowrap"
                    >
                      {prazo.dias_restantes === 0
                        ? "Hoje"
                        : prazo.dias_restantes === 1
                        ? "Amanhã"
                        : `${prazo.dias_restantes}d`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          {proximosPrazos.length > 5 && (
            <Link
              to="/dashboard/processos/calendario"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              +{proximosPrazos.length - 5} prazos <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Processos sem atualização */}
        {processosSemAtualizacao.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Sem Atualização
            </h4>
            <div className="space-y-2">
              {processosSemAtualizacao.map((proc) => (
                <div
                  key={proc.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => onOpenProcesso(proc.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {proc.numero_processo || proc.tipo}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {proc.autor && proc.reu
                        ? `${proc.autor} vs ${proc.reu}`
                        : proc.autor || proc.reu || proc.tipo}
                    </p>
                  </div>
                  <Badge
                    variant={proc.dias_sem_atualizacao >= 999 ? "secondary" : proc.dias_sem_atualizacao > 60 ? "destructive" : "secondary"}
                    className={cn(
                      "text-xs whitespace-nowrap ml-2",
                      proc.dias_sem_atualizacao < 999 && proc.dias_sem_atualizacao <= 60 && "bg-yellow-100 text-yellow-800 border-yellow-200"
                    )}
                  >
                    {proc.dias_sem_atualizacao >= 999 ? "S/ registro" : `${proc.dias_sem_atualizacao}d`}
                  </Badge>
                </div>
              ))}
            </div>
            <Link
              to="/dashboard/processos"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function VisaoOperacional({
  processos,
  proximosPrazos,
  processosSemAtualizacao,
  loading,
}: VisaoOperacionalProps) {
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null);

  return (
    <>
      <ProcessosPrazosCard
        processos={processos}
        proximosPrazos={proximosPrazos}
        processosSemAtualizacao={processosSemAtualizacao}
        loading={loading}
        onOpenProcesso={(id) => setSelectedProcessoId(id)}
      />
      <ProcessoDetailsDialog
        processoId={selectedProcessoId}
        open={!!selectedProcessoId}
        onClose={() => setSelectedProcessoId(null)}
      />
    </>
  );
}
