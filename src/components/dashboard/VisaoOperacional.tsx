import { Link } from "react-router-dom";
import {
  Scale,
  ArrowRight,
  Calendar,
  AlertTriangle,
  Users,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  ProcessosPorStatus,
  PrazoProximo,
  PipelineEstagio,
  LeadRecente,
} from "@/hooks/useDashboardCompleto";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VisaoOperacionalProps {
  processos: ProcessosPorStatus;
  proximosPrazos: PrazoProximo[];
  pipeline: PipelineEstagio[];
  leadsRecentes: LeadRecente[];
  loading?: boolean;
}

const ESTAGIO_LABELS: Record<string, string> = {
  novo: "Novo",
  contato: "Contato",
  analise: "Análise",
  proposta: "Proposta",
  fechado: "Fechado",
};

function ProcessosPrazosCard({
  processos,
  proximosPrazos,
  loading,
}: {
  processos: ProcessosPorStatus;
  proximosPrazos: PrazoProximo[];
  loading?: boolean;
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
      </CardContent>
    </Card>
  );
}

function PipelineVendasCard({
  pipeline,
  leadsRecentes,
  loading,
}: {
  pipeline: PipelineEstagio[];
  leadsRecentes: LeadRecente[];
  loading?: boolean;
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

  const totalPipeline = pipeline.reduce((acc, p) => acc + p.count, 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Pipeline de Vendas</CardTitle>
          </div>
          <Link
            to="/dashboard/leads"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Mini funnel */}
        <div className="space-y-2">
          {pipeline.map((estagio) => {
            const pct = totalPipeline > 0 ? (estagio.count / totalPipeline) * 100 : 0;
            return (
              <div key={estagio.estagio} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16 text-right">
                  {estagio.label}
                </span>
                <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                  <div
                    className="h-full bg-primary/80 rounded-md transition-all duration-500 flex items-center justify-end px-2"
                    style={{ width: `${Math.max(pct, 8)}%` }}
                  >
                    <span className="text-xs font-medium text-primary-foreground">
                      {estagio.count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leads recentes */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Leads Recentes</h4>
          {leadsRecentes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum lead recente</p>
          ) : (
            <div className="space-y-2">
              {leadsRecentes.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lead.nome_completo}</p>
                    <p className="text-xs text-muted-foreground">{lead.tipo_processo}</p>
                  </div>
                  <Badge variant="outline" className="text-xs ml-2">
                    {ESTAGIO_LABELS[lead.estagio || "novo"] || lead.estagio}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function VisaoOperacional({
  processos,
  proximosPrazos,
  pipeline,
  leadsRecentes,
  loading,
}: VisaoOperacionalProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ProcessosPrazosCard
        processos={processos}
        proximosPrazos={proximosPrazos}
        loading={loading}
      />
      <PipelineVendasCard pipeline={pipeline} leadsRecentes={leadsRecentes} loading={loading} />
    </div>
  );
}
